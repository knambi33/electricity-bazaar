import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { authenticateToken } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

const createEnquirySchema = z.object({
  listingId: z.string().uuid(),
  requirementId: z.string().uuid().optional().nullable(),
  proposedCapacityMw: z.number().positive().optional().nullable(),
  message: z.string().min(10),
  buyerConsentGranted: z.boolean().refine(val => val === true, {
    message: "Explicit buyer consent is required to transmit procurement enquiry"
  })
});

// Protected: Submit an enquiry to a supplier
router.post("/", authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const validated = createEnquirySchema.parse(req.body);
    const buyerOrgId = req.user!.activeOrganisationId!;

    const listing = await prisma.marketplaceListing.findUnique({
      where: { id: validated.listingId }
    });

    if (!listing) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Listing does not exist" } });
      return;
    }

    if (listing.organisationId === buyerOrgId) {
      res.status(400).json({ success: false, error: { code: "INVALID_ACTION", message: "Cannot send enquiry to your own listing" } });
      return;
    }

    const enquiryCode = `ENQ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const enquiry = await prisma.enquiry.create({
      data: {
        enquiryCode,
        listingId: listing.id,
        buyerOrganisationId: buyerOrgId,
        sellerOrganisationId: listing.organisationId,
        requirementId: validated.requirementId,
        proposedCapacityMw: validated.proposedCapacityMw,
        message: validated.message,
        buyerConsentGranted: validated.buyerConsentGranted,
        status: "SUBMITTED",
        messages: {
          create: {
            senderUserId: req.user!.id,
            senderOrgId: buyerOrgId,
            senderName: req.user!.fullName,
            messageText: validated.message
          }
        }
      },
      include: {
        messages: true,
        listing: {
          select: { title: true, listingCode: true }
        }
      }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        organisationId: buyerOrgId,
        action: "ENQUIRY_INITIATED",
        entityName: "Enquiry",
        entityId: enquiry.id,
        metadata: JSON.stringify({ enquiryCode, listingCode: listing.listingCode })
      }
    });

    res.status(201).json({ success: true, data: enquiry });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { code: "VALIDATION_FAILED", details: err.errors } });
      return;
    }
    console.error("Create enquiry error:", err);
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to submit enquiry" } });
  }
});

// Protected: Get enquiries for the user's organisation (both sent and received)
router.get("/", authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const orgId = req.user!.activeOrganisationId!;
    const { role } = req.query; // 'buyer' or 'seller'

    const where: any = {};
    if (role === "seller") {
      where.sellerOrganisationId = orgId;
    } else if (role === "buyer") {
      where.buyerOrganisationId = orgId;
    } else {
      where.OR = [
        { buyerOrganisationId: orgId },
        { sellerOrganisationId: orgId }
      ];
    }

    const enquiries = await prisma.enquiry.findMany({
      where,
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            listingCode: true,
            state: true,
            category: true,
            availableCapacityMw: true
          }
        },
        buyerOrganisation: {
          select: {
            id: true,
            legalName: true,
            tradeName: true,
            registeredState: true
          }
        },
        sellerOrganisation: {
          select: {
            id: true,
            legalName: true,
            tradeName: true,
            registeredState: true
          }
        },
        _count: {
          select: { messages: true }
        }
      },
      orderBy: { updatedAt: "desc" }
    });

    res.json({ success: true, data: enquiries });
  } catch (err) {
    console.error("Get enquiries error:", err);
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch enquiries" } });
  }
});

// Protected: Get single enquiry thread details
router.get("/:id", authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const orgId = req.user!.activeOrganisationId!;

    const enquiry = await prisma.enquiry.findUnique({
      where: { id },
      include: {
        listing: {
          include: {
            organisation: {
              select: {
                id: true,
                legalName: true,
                tradeName: true,
                verificationStatus: true
              }
            }
          }
        },
        buyerOrganisation: {
          select: {
            id: true,
            legalName: true,
            tradeName: true,
            registeredState: true
          }
        },
        sellerOrganisation: {
          select: {
            id: true,
            legalName: true,
            tradeName: true,
            registeredState: true
          }
        },
        requirement: true,
        messages: {
          orderBy: { createdAt: "asc" }
        }
      }
    });

    if (!enquiry) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Enquiry not found" } });
      return;
    }

    // Verify tenant authorization
    const isParticipant = enquiry.buyerOrganisationId === orgId || enquiry.sellerOrganisationId === orgId;
    if (!isParticipant && req.user!.role !== "PLATFORM_ADMIN") {
      res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "Cannot access another organization's enquiry" } });
      return;
    }

    res.json({ success: true, data: enquiry });
  } catch (err) {
    console.error("Get enquiry details error:", err);
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to load enquiry" } });
  }
});

// Protected: Post a new message in an enquiry thread
router.post("/:id/messages", authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { messageText } = req.body;
    const orgId = req.user!.activeOrganisationId!;

    if (!messageText || messageText.trim().length === 0) {
      res.status(400).json({ success: false, error: { code: "EMPTY_MESSAGE", message: "Message cannot be empty" } });
      return;
    }

    const enquiry = await prisma.enquiry.findUnique({
      where: { id }
    });

    if (!enquiry) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Enquiry not found" } });
      return;
    }

    const isParticipant = enquiry.buyerOrganisationId === orgId || enquiry.sellerOrganisationId === orgId;
    if (!isParticipant && req.user!.role !== "PLATFORM_ADMIN") {
      res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "Not authorized to post to this enquiry" } });
      return;
    }

    const message = await prisma.enquiryMessage.create({
      data: {
        enquiryId: id,
        senderUserId: req.user!.id,
        senderOrgId: orgId,
        senderName: req.user!.fullName,
        messageText: messageText.trim()
      }
    });

    // Update enquiry timestamp and status if appropriate
    let newStatus = enquiry.status;
    if (orgId === enquiry.sellerOrganisationId && enquiry.status === "SUBMITTED") {
      newStatus = "RESPONSE_RECEIVED";
    }

    await prisma.enquiry.update({
      where: { id },
      data: {
        status: newStatus,
        updatedAt: new Date()
      }
    });

    res.status(201).json({ success: true, data: message });
  } catch (err) {
    console.error("Post message error:", err);
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to send message" } });
  }
});

// Protected: Update enquiry status
router.patch("/:id/status", authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const orgId = req.user!.activeOrganisationId!;

    const validStatuses = [
      "SUBMITTED",
      "UNDER_REVIEW",
      "SHARED_WITH_SUPPLIER",
      "RESPONSE_RECEIVED",
      "NEGOTIATION",
      "CLOSED",
      "WITHDRAWN"
    ];

    if (!validStatuses.includes(status)) {
      res.status(400).json({ success: false, error: { code: "INVALID_STATUS", message: "Invalid status value" } });
      return;
    }

    const enquiry = await prisma.enquiry.findUnique({
      where: { id }
    });

    if (!enquiry) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Enquiry not found" } });
      return;
    }

    const isParticipant = enquiry.buyerOrganisationId === orgId || enquiry.sellerOrganisationId === orgId;
    if (!isParticipant && req.user!.role !== "PLATFORM_ADMIN") {
      res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "Not authorized to update status" } });
      return;
    }

    const updated = await prisma.enquiry.update({
      where: { id },
      data: { status }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        organisationId: orgId,
        action: "ENQUIRY_STATUS_CHANGED",
        entityName: "Enquiry",
        entityId: id,
        metadata: JSON.stringify({ oldStatus: enquiry.status, newStatus: status })
      }
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error("Update status error:", err);
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to update status" } });
  }
});

export default router;
