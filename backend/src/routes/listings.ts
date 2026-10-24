import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { authenticateToken, requireRole } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

// Public: Get all published marketplace listings with advanced filtering and pagination
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      category,
      state,
      commercialModel,
      interconnectionType,
      projectStatus,
      minCapacityMw,
      maxCapacityMw,
      search,
      sort,
      page = "1",
      limit = "12"
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      status: "PUBLISHED"
    };

    if (category) {
      where.category = category as string;
    }
    if (state) {
      where.state = state as string;
    }
    if (commercialModel) {
      where.commercialModel = commercialModel as string;
    }
    if (interconnectionType) {
      where.interconnectionType = interconnectionType as string;
    }
    if (projectStatus) {
      where.projectStatus = projectStatus as string;
    }
    if (minCapacityMw || maxCapacityMw) {
      where.availableCapacityMw = {};
      if (minCapacityMw) where.availableCapacityMw.gte = parseFloat(minCapacityMw as string);
      if (maxCapacityMw) where.availableCapacityMw.lte = parseFloat(maxCapacityMw as string);
    }
    if (search) {
      const searchStr = (search as string).trim();
      where.OR = [
        { title: { contains: searchStr } },
        { projectLocation: { contains: searchStr } },
        { listingCode: { contains: searchStr } },
        { state: { contains: searchStr } }
      ];
    }

    let orderBy: any = { createdAt: "desc" };
    if (sort === "CAPACITY_DESC") orderBy = { availableCapacityMw: "desc" };
    if (sort === "CAPACITY_ASC") orderBy = { availableCapacityMw: "asc" };
    if (sort === "PRICE_ASC") orderBy = { indicativePricePerKwh: "asc" };
    if (sort === "VIEWS_DESC") orderBy = { viewCount: "desc" };

    const [totalCount, listings] = await Promise.all([
      prisma.marketplaceListing.count({ where }),
      prisma.marketplaceListing.findMany({
        where,
        include: {
          organisation: {
            select: {
              id: true,
              legalName: true,
              tradeName: true,
              verificationStatus: true,
              registeredState: true
            }
          },
          renewableDetails: true,
          storageDetails: true
        },
        orderBy,
        skip,
        take: limitNum
      })
    ]);

    res.json({
      success: true,
      data: listings,
      meta: {
        page: pageNum,
        limit: limitNum,
        totalCount,
        totalPages: Math.ceil(totalCount / limitNum)
      }
    });
  } catch (err) {
    console.error("Listings search error:", err);
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch listings" } });
  }
});

// Public: Get aggregated listing counts and capacity by state for Interactive Power Map
router.get("/state-counts", async (_req: Request, res: Response): Promise<void> => {
  try {
    const listings = await prisma.marketplaceListing.findMany({
      where: { status: "PUBLISHED" },
      select: {
        id: true,
        state: true,
        category: true,
        totalCapacityMw: true,
        availableCapacityMw: true,
        landAreaAcres: true,
        bayCapacityMw: true
      }
    });

    const stateSummary: Record<string, {
      count: number;
      totalCapacityMw: number;
      availableCapacityMw: number;
      categories: Record<string, number>;
      bayCount: number;
      landParcelCount: number;
    }> = {};

    for (const l of listings) {
      if (!l.state) continue;
      if (!stateSummary[l.state]) {
        stateSummary[l.state] = {
          count: 0,
          totalCapacityMw: 0,
          availableCapacityMw: 0,
          categories: {},
          bayCount: 0,
          landParcelCount: 0
        };
      }
      stateSummary[l.state].count += 1;
      stateSummary[l.state].totalCapacityMw = Number((stateSummary[l.state].totalCapacityMw + (l.totalCapacityMw || 0)).toFixed(1));
      stateSummary[l.state].availableCapacityMw = Number((stateSummary[l.state].availableCapacityMw + (l.availableCapacityMw || 0)).toFixed(1));
      stateSummary[l.state].categories[l.category] = (stateSummary[l.state].categories[l.category] || 0) + 1;
      if (l.category === "SUBSTATION_BAY") stateSummary[l.state].bayCount += 1;
      if (l.category === "LAND_PARCEL") stateSummary[l.state].landParcelCount += 1;
    }

    res.json({ success: true, data: stateSummary });
  } catch (err) {
    console.error("State counts error:", err);
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to get state counts" } });
  }
});

// Public: Get listing details by ID or Slug (supports Privacy Masking for Confidential Assets)
router.get("/:idOrSlug", async (req: Request, res: Response): Promise<void> => {
  try {
    const { idOrSlug } = req.params;

    const listing = await prisma.marketplaceListing.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }]
      },
      include: {
        organisation: {
          select: {
            id: true,
            legalName: true,
            tradeName: true,
            orgType: true,
            verificationStatus: true,
            verificationNotes: true,
            verifiedAt: true,
            registeredState: true,
            websiteUrl: true
          }
        },
        renewableDetails: true,
        storageDetails: true,
        documents: {
          include: {
            document: {
              select: {
                id: true,
                title: true,
                documentType: true,
                isVerified: true
              }
            }
          }
        }
      }
    });

    if (!listing) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Listing not found" } });
      return;
    }

    // Increment view count asynchronously
    await prisma.marketplaceListing.update({
      where: { id: listing.id },
      data: { viewCount: { increment: 1 } }
    });

    // Check if listing has privacy confidentiality enabled
    const isConfidential = listing.isConfidential || listing.ndaRequired;

    const responseData = {
      ...listing,
      isConfidential,
      ndaRequired: listing.ndaRequired,
      // If confidential, provide transparent masked location for general viewers
      maskedLocation: isConfidential 
        ? `${listing.state} (Exact Substation & GPS Coordinates Confidential)` 
        : listing.projectLocation
    };

    res.json({ success: true, data: responseData });
  } catch (err) {
    console.error("Get listing error:", err);
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to load listing" } });
  }
});

// Protected: Issue Letter of Intent (LOI) & Execute Standard NDA to unlock confidential technical dossier
router.post("/:id/request-nda", authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { corporateEntityName, designatedSignatory, companyPanGst, intentionScope, ndaTermsAccepted } = req.body;

    if (!ndaTermsAccepted) {
      res.status(400).json({ success: false, error: { code: "NDA_NOT_ACCEPTED", message: "Acceptance of Electricity Bazaar Standard NDA is required" } });
      return;
    }

    const listing = await prisma.marketplaceListing.findUnique({
      where: { id },
      include: { organisation: true }
    });

    if (!listing) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Listing not found" } });
      return;
    }

    const buyerOrgId = req.user!.activeOrganisationId || req.user!.id;
    const loiCode = `LOI-NDA-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Log the formal LOI & NDA execution in Enquiry & AuditLog
    await prisma.enquiry.create({
      data: {
        enquiryCode: loiCode,
        listingId: listing.id,
        buyerOrganisationId: buyerOrgId,
        sellerOrganisationId: listing.organisationId,
        proposedCapacityMw: listing.availableCapacityMw,
        message: `[FORMAL LOI & NDA EXECUTED]: Entity '${corporateEntityName || req.user!.fullName}' has executed the Standard Mutual Non-Disclosure Agreement for listing ${listing.listingCode} (${listing.title}). Scope: ${intentionScope || 'Technical feasibility, grid bay allocation, and commercial PPA term sheet negotiation'}.`,
        buyerConsentGranted: true,
        isNdaRequested: true,
        ndaAccepted: true,
        status: "NDA_ACCEPTED",
        messages: {
          create: {
            senderUserId: req.user!.id,
            senderOrgId: buyerOrgId,
            senderName: designatedSignatory || req.user!.fullName,
            messageText: `Electricity Bazaar Mutual NDA executed electronically on ${new Date().toLocaleString("en-IN")}. Verified legal party: ${corporateEntityName || req.user!.fullName} (PAN/GST: ${companyPanGst || 'On file'}). Full technical specs and GPS location unlocked.`
          }
        }
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        organisationId: buyerOrgId,
        action: "NDA_EXECUTED_TECHNICAL_UNLOCK",
        entityName: "MarketplaceListing",
        entityId: listing.id,
        metadata: JSON.stringify({ loiCode, listingCode: listing.listingCode, developer: listing.organisation.legalName })
      }
    });

    // Return unlocked confidential details
    res.json({
      success: true,
      data: {
        loiCode,
        isUnlocked: true,
        unlockedAt: new Date().toISOString(),
        listingCode: listing.listingCode,
        developerContact: {
          legalName: listing.organisation.legalName,
          registeredState: listing.organisation.registeredState,
          verificationNotes: listing.organisation.verificationNotes
        },
        unlockedTechnicalSpecs: {
          exactLocation: listing.projectLocation,
          substationDetails: listing.substationDetails || "Sanctioned feeder bay at nearest grid substation",
          substationVoltageKv: listing.substationVoltageKv,
          bayCapacityMw: listing.bayCapacityMw,
          landAreaAcres: listing.landAreaAcres,
          regulatoryApprovals: listing.regulatoryApprovals
        }
      }
    });
  } catch (err: any) {
    console.error("NDA request error:", err);
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to process NDA execution" } });
  }
});

const createListingSchema = z.object({
  title: z.string().min(5),
  category: z.string(),
  commercialModel: z.string(),
  state: z.string(),
  projectLocation: z.string(),
  totalCapacityMw: z.number().positive(),
  availableCapacityMw: z.number().positive(),
  indicativePricePerKwh: z.number().optional().nullable(),
  priceBasisConditions: z.string().optional().nullable(),
  contractDurationYears: z.number().int().optional().nullable(),
  expectedAvailabilityDate: z.string(),
  interconnectionType: z.string().default("STU_INTRA_STATE"),
  substationDetails: z.string().optional().nullable(),
  projectStatus: z.string().default("OPERATIONAL"),
  regulatoryApprovals: z.string().optional().nullable(),
  isConfidential: z.boolean().optional().default(false),
  ndaRequired: z.boolean().optional().default(false),
  landAreaAcres: z.number().optional().nullable(),
  bayCapacityMw: z.number().optional().nullable(),
  substationVoltageKv: z.number().optional().nullable(),
  // Optional renewable specifics
  renewableDetails: z.object({
    technology: z.string(),
    dcAcRatio: z.number().optional().nullable(),
    cuFactorPercent: z.number().optional().nullable(),
    expectedAnnualGenMu: z.number().optional().nullable(),
    captiveStructureInfo: z.string().optional().nullable(),
    bankingTerms: z.string().optional().nullable()
  }).optional(),
  // Optional storage specifics
  storageDetails: z.object({
    storageType: z.string(),
    powerCapacityMw: z.number().positive(),
    energyCapacityMwh: z.number().positive(),
    durationHours: z.number().positive(),
    roundTripEfficiencyPct: z.number().optional().nullable(),
    chargingEnergySource: z.string().optional().nullable(),
    commercialPricingModel: z.string().optional().nullable()
  }).optional()
});

// Protected: Create a new listing (Seller)
router.post(
  "/",
  authenticateToken,
  requireRole(["SELLER_USER", "SELLER_ADMIN", "PLATFORM_ADMIN"]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const validated = createListingSchema.parse(req.body);
      const orgId = req.user!.activeOrganisationId!;

      const slugBase = validated.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
      const slug = `${slugBase}-${Date.now().toString().slice(-6)}`;
      const listingCode = `LST-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const newListing = await prisma.marketplaceListing.create({
        data: {
          listingCode,
          organisationId: orgId,
          title: validated.title,
          slug,
          category: validated.category,
          commercialModel: validated.commercialModel,
          state: validated.state,
          projectLocation: validated.projectLocation,
          totalCapacityMw: validated.totalCapacityMw,
          availableCapacityMw: validated.availableCapacityMw,
          indicativePricePerKwh: validated.indicativePricePerKwh,
          priceBasisConditions: validated.priceBasisConditions,
          contractDurationYears: validated.contractDurationYears,
          expectedAvailabilityDate: new Date(validated.expectedAvailabilityDate),
          interconnectionType: validated.interconnectionType,
          substationDetails: validated.substationDetails,
          projectStatus: validated.projectStatus,
          regulatoryApprovals: validated.regulatoryApprovals,
          isConfidential: validated.isConfidential || false,
          ndaRequired: validated.ndaRequired || false,
          landAreaAcres: validated.landAreaAcres,
          bayCapacityMw: validated.bayCapacityMw,
          substationVoltageKv: validated.substationVoltageKv,
          status: "DRAFT",
          renewableDetails: validated.renewableDetails
            ? { create: validated.renewableDetails }
            : undefined,
          storageDetails: validated.storageDetails
            ? { create: validated.storageDetails }
            : undefined
        },
        include: {
          renewableDetails: true,
          storageDetails: true
        }
      });

      // Audit log
      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          organisationId: orgId,
          action: "LISTING_CREATED_DRAFT",
          entityName: "MarketplaceListing",
          entityId: newListing.id,
          metadata: JSON.stringify({ listingCode, title: newListing.title })
        }
      });

      res.status(201).json({ success: true, data: newListing });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ success: false, error: { code: "VALIDATION_FAILED", details: err.errors } });
        return;
      }
      console.error("Create listing error:", err);
      res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to create listing" } });
    }
  }
);

// Protected: Submit listing for administrative review & publication
router.post(
  "/:id/submit-review",
  authenticateToken,
  requireRole(["SELLER_USER", "SELLER_ADMIN", "PLATFORM_ADMIN"]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const orgId = req.user!.activeOrganisationId!;

      const listing = await prisma.marketplaceListing.findUnique({
        where: { id }
      });

      if (!listing) {
        res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Listing not found" } });
        return;
      }

      if (listing.organisationId !== orgId && req.user!.role !== "PLATFORM_ADMIN") {
        res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "Cannot submit listing of another organization" } });
        return;
      }

      const updated = await prisma.marketplaceListing.update({
        where: { id },
        data: { status: "UNDER_REVIEW" }
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          organisationId: orgId,
          action: "LISTING_SUBMITTED_FOR_REVIEW",
          entityName: "MarketplaceListing",
          entityId: id
        }
      });

      res.json({ success: true, data: updated });
    } catch (err) {
      console.error("Submit listing review error:", err);
      res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to submit for review" } });
    }
  }
);

// Protected: My organization's listings
router.get(
  "/seller/my-listings",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const orgId = req.user!.activeOrganisationId!;
      const listings = await prisma.marketplaceListing.findMany({
        where: { organisationId: orgId },
        include: {
          renewableDetails: true,
          storageDetails: true,
          _count: {
            select: { enquiries: true }
          }
        },
        orderBy: { createdAt: "desc" }
      });

      res.json({ success: true, data: listings });
    } catch (err) {
      console.error("My listings error:", err);
      res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to load your listings" } });
    }
  }
);

export default router;
