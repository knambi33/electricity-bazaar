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

// Public: Get listing details by ID or Slug
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

    res.json({ success: true, data: listing });
  } catch (err) {
    console.error("Get listing error:", err);
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to load listing" } });
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
