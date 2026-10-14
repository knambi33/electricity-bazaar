import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { authenticateToken, requireRole } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

// Enforce PLATFORM_ADMIN or VERIFICATION_OFFICER for all admin routes
router.use(authenticateToken);
router.use(requireRole(["PLATFORM_ADMIN", "VERIFICATION_OFFICER"]));

// Operational platform metrics
router.get("/stats", async (_req: Request, res: Response): Promise<void> => {
  try {
    const [
      totalUsers,
      totalOrganisations,
      publishedListings,
      pendingReviewListings,
      totalEnquiries,
      totalRequirements
    ] = await Promise.all([
      prisma.user.count(),
      prisma.organisation.count(),
      prisma.marketplaceListing.count({ where: { status: "PUBLISHED" } }),
      prisma.marketplaceListing.count({ where: { status: "UNDER_REVIEW" } }),
      prisma.enquiry.count(),
      prisma.buyerRequirement.count()
    ]);

    const aggregateCapacity = await prisma.marketplaceListing.aggregate({
      where: { status: "PUBLISHED" },
      _sum: { availableCapacityMw: true, totalCapacityMw: true }
    });

    res.json({
      success: true,
      data: {
        totalUsers,
        totalOrganisations,
        publishedListings,
        pendingReviewListings,
        totalEnquiries,
        totalRequirements,
        totalCapacityMw: aggregateCapacity._sum.totalCapacityMw || 0,
        availableCapacityMw: aggregateCapacity._sum.availableCapacityMw || 0
      }
    });
  } catch (err) {
    console.error("Admin stats error:", err);
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch stats" } });
  }
});

// Listing review queue
router.get("/listings/review-queue", async (_req: Request, res: Response): Promise<void> => {
  try {
    const listings = await prisma.marketplaceListing.findMany({
      where: {
        status: { in: ["UNDER_REVIEW", "DRAFT"] }
      },
      include: {
        organisation: true,
        renewableDetails: true,
        storageDetails: true
      },
      orderBy: { updatedAt: "desc" }
    });

    res.json({ success: true, data: listings });
  } catch (err) {
    console.error("Review queue error:", err);
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch review queue" } });
  }
});

const reviewDecisionSchema = z.object({
  action: z.enum(["APPROVE", "REJECT", "SUSPEND"]),
  notes: z.string().min(5)
});

// Approve, reject or suspend listing
router.post("/listings/:id/review", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { action, notes } = reviewDecisionSchema.parse(req.body);

    const listing = await prisma.marketplaceListing.findUnique({ where: { id } });
    if (!listing) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Listing not found" } });
      return;
    }

    const newStatus = action === "APPROVE" ? "PUBLISHED" : action === "REJECT" ? "DRAFT" : "SUSPENDED";

    const updated = await prisma.marketplaceListing.update({
      where: { id },
      data: { status: newStatus }
    });

    // Immutable audit record
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        organisationId: listing.organisationId,
        action: `LISTING_${action}`,
        entityName: "MarketplaceListing",
        entityId: id,
        metadata: JSON.stringify({ reviewerNotes: notes, previousStatus: listing.status, newStatus })
      }
    });

    res.json({ success: true, data: updated });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { code: "VALIDATION_FAILED", details: err.errors } });
      return;
    }
    console.error("Review decision error:", err);
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to update review" } });
  }
});

// Organisations verification queue
router.get("/verifications/queue", async (_req: Request, res: Response): Promise<void> => {
  try {
    const organisations = await prisma.organisation.findMany({
      include: {
        documents: true,
        _count: {
          select: { listings: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    res.json({ success: true, data: organisations });
  } catch (err) {
    console.error("Verifications queue error:", err);
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch verifications" } });
  }
});

const verificationDecisionSchema = z.object({
  newStatus: z.enum([
    "UNVERIFIED",
    "SUBMITTED_FOR_VERIFICATION",
    "DOCUMENTS_REVIEWED",
    "VERIFIED_FOR_STATED_SCOPE",
    "VERIFICATION_EXPIRED",
    "REJECTED"
  ]),
  scopeNotes: z.string().min(5)
});

// Update organization verification badge & scope
router.post("/verifications/:orgId/decision", async (req: Request, res: Response): Promise<void> => {
  try {
    const { orgId } = req.params;
    const { newStatus, scopeNotes } = verificationDecisionSchema.parse(req.body);

    const org = await prisma.organisation.findUnique({ where: { id: orgId } });
    if (!org) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Organisation not found" } });
      return;
    }

    const previousStatus = org.verificationStatus;

    const [updatedOrg, record] = await prisma.$transaction([
      prisma.organisation.update({
        where: { id: orgId },
        data: {
          verificationStatus: newStatus,
          verificationNotes: scopeNotes,
          verifiedAt: newStatus === "VERIFIED_FOR_STATED_SCOPE" ? new Date() : org.verifiedAt
        }
      }),
      prisma.verificationRecord.create({
        data: {
          organisationId: orgId,
          reviewerUserId: req.user!.id,
          previousStatus,
          newStatus,
          scopeNotes
        }
      })
    ]);

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        organisationId: orgId,
        action: "ORGANISATION_VERIFICATION_DECISION",
        entityName: "Organisation",
        entityId: orgId,
        metadata: JSON.stringify({ previousStatus, newStatus, scopeNotes })
      }
    });

    res.json({ success: true, data: { organisation: updatedOrg, record } });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { code: "VALIDATION_FAILED", details: err.errors } });
      return;
    }
    console.error("Verification decision error:", err);
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to record verification" } });
  }
});

// System Audit Logs
router.get("/audit-logs", async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = "1", limit = "30" } = req.query;
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 30;

    const [totalCount, logs] = await Promise.all([
      prisma.auditLog.count(),
      prisma.auditLog.findMany({
        include: {
          user: {
            select: { id: true, email: true, fullName: true }
          },
          organisation: {
            select: { id: true, legalName: true }
          }
        },
        orderBy: { createdAt: "desc" },
        skip: (pageNum - 1) * limitNum,
        take: limitNum
      })
    ]);

    res.json({
      success: true,
      data: logs,
      meta: {
        page: pageNum,
        limit: limitNum,
        totalCount,
        totalPages: Math.ceil(totalCount / limitNum)
      }
    });
  } catch (err) {
    console.error("Audit logs error:", err);
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch audit logs" } });
  }
});

export default router;
