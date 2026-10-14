import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { authenticateToken, requireRole } from "../middleware/auth";
import { evaluateListingMatch, RequirementMatchCriteria } from "../utils/matching";

const router = Router();
const prisma = new PrismaClient();

const createRequirementSchema = z.object({
  title: z.string().min(5),
  industryType: z.string().min(2),
  state: z.string().min(2),
  discomName: z.string().min(2),
  numberOfFacilities: z.number().int().default(1),
  contractDemandKva: z.number().positive(),
  sanctionedLoadKw: z.number().positive(),
  monthlyConsumptionKwh: z.number().positive(),
  currentSupplyCostPerKwh: z.number().positive().optional().nullable(),
  targetRenewablePercent: z.number().min(0).max(100).default(50),
  preferredTechnology: z.string().optional().nullable(),
  commercialModel: z.string().default("THIRD_PARTY_OPEN_ACCESS"),
  requiredStartDate: z.string(),
  contractTenureYears: z.number().int().positive(),
  openAccessPreference: z.string().optional().nullable(),
  additionalNotes: z.string().optional().nullable(),
  isConsentGivenToShare: z.boolean().default(false)
});

// Protected: Submit an electricity requirement
router.post(
  "/",
  authenticateToken,
  requireRole(["BUYER_USER", "BUYER_ADMIN", "PLATFORM_ADMIN"]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const validated = createRequirementSchema.parse(req.body);
      const orgId = req.user!.activeOrganisationId!;

      const requirementCode = `REQ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const requirement = await prisma.buyerRequirement.create({
        data: {
          requirementCode,
          organisationId: orgId,
          title: validated.title,
          industryType: validated.industryType,
          state: validated.state,
          discomName: validated.discomName,
          numberOfFacilities: validated.numberOfFacilities,
          contractDemandKva: validated.contractDemandKva,
          sanctionedLoadKw: validated.sanctionedLoadKw,
          monthlyConsumptionKwh: validated.monthlyConsumptionKwh,
          currentSupplyCostPerKwh: validated.currentSupplyCostPerKwh,
          targetRenewablePercent: validated.targetRenewablePercent,
          preferredTechnology: validated.preferredTechnology,
          commercialModel: validated.commercialModel,
          requiredStartDate: new Date(validated.requiredStartDate),
          contractTenureYears: validated.contractTenureYears,
          openAccessPreference: validated.openAccessPreference,
          additionalNotes: validated.additionalNotes,
          status: "ACTIVE",
          isConsentGivenToShare: validated.isConsentGivenToShare
        }
      });

      // Audit log
      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          organisationId: orgId,
          action: "REQUIREMENT_SUBMITTED",
          entityName: "BuyerRequirement",
          entityId: requirement.id,
          metadata: JSON.stringify({ requirementCode, title: requirement.title })
        }
      });

      res.status(201).json({ success: true, data: requirement });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ success: false, error: { code: "VALIDATION_FAILED", details: err.errors } });
        return;
      }
      console.error("Create requirement error:", err);
      res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to submit requirement" } });
    }
  }
);

// Protected: Get all requirements for the authenticated buyer's organisation
router.get(
  "/",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const orgId = req.user!.activeOrganisationId!;
      const requirements = await prisma.buyerRequirement.findMany({
        where: { organisationId: orgId },
        include: {
          _count: {
            select: { enquiries: true }
          }
        },
        orderBy: { createdAt: "desc" }
      });

      res.json({ success: true, data: requirements });
    } catch (err) {
      console.error("Get requirements error:", err);
      res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch requirements" } });
    }
  }
);

// Protected: Get requirement matches
router.get(
  "/:id/matches",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const orgId = req.user!.activeOrganisationId!;

      const requirement = await prisma.buyerRequirement.findUnique({
        where: { id }
      });

      if (!requirement) {
        res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Requirement not found" } });
        return;
      }

      // Check tenant authorization
      if (requirement.organisationId !== orgId && req.user!.role !== "PLATFORM_ADMIN") {
        res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "Cannot access another organization's requirements" } });
        return;
      }

      // Fetch all published listings
      const candidates = await prisma.marketplaceListing.findMany({
        where: { status: "PUBLISHED" },
        include: {
          organisation: {
            select: {
              legalName: true,
              verificationStatus: true
            }
          },
          renewableDetails: true,
          storageDetails: true
        }
      });

      const criteria: RequirementMatchCriteria = {
        state: requirement.state,
        contractDemandMw: requirement.contractDemandKva / 1000,
        targetRenewablePercent: requirement.targetRenewablePercent,
        preferredTechnology: requirement.preferredTechnology,
        commercialModel: requirement.commercialModel,
        requiredStartDate: requirement.requiredStartDate
      };

      const evaluated = candidates.map(listing => {
        const matchResult = evaluateListingMatch(criteria, listing as any);
        return {
          ...matchResult,
          listing
        };
      });

      // Sort by score descending
      evaluated.sort((a, b) => b.scorePercent - a.scorePercent);

      res.json({
        success: true,
        data: {
          requirement,
          matches: evaluated
        }
      });
    } catch (err) {
      console.error("Match requirement error:", err);
      res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to calculate matches" } });
    }
  }
);

// Public / Guest Match: Used by the 4-Stage Bill-to-Procurement Wizard on the public website
router.post("/guest-match", async (req: Request, res: Response): Promise<void> => {
  try {
    const { state, contractDemandMw, targetRenewablePercent = 80, preferredTechnology, commercialModel = "GROUP_CAPTIVE" } = req.body;

    if (!state || !contractDemandMw) {
      res.status(400).json({ success: false, error: { code: "MISSING_PARAMS", message: "State and contractDemandMw are required" } });
      return;
    }

    const candidates = await prisma.marketplaceListing.findMany({
      where: { status: "PUBLISHED" },
      include: {
        organisation: {
          select: {
            legalName: true,
            verificationStatus: true,
            registeredState: true
          }
        },
        renewableDetails: true,
        storageDetails: true
      }
    });

    const criteria: RequirementMatchCriteria = {
      state,
      contractDemandMw: parseFloat(contractDemandMw),
      targetRenewablePercent: parseFloat(targetRenewablePercent),
      preferredTechnology,
      commercialModel,
      requiredStartDate: new Date()
    };

    const evaluated = candidates.map(listing => {
      const matchResult = evaluateListingMatch(criteria, listing as any);
      return {
        ...matchResult,
        listing
      };
    });

    evaluated.sort((a, b) => b.scorePercent - a.scorePercent);

    res.json({
      success: true,
      data: evaluated
    });
  } catch (err) {
    console.error("Guest match error:", err);
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to evaluate matches" } });
  }
});

export default router;
