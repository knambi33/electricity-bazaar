import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { calculateLandedCost, LandedCostInputs } from "../utils/calculator";
import { STATE_REGULATORY_PROFILES } from "../data/regulatoryRates";
import { authenticateToken } from "../middleware/auth";
import { extractBillDetails, SAMPLE_BILLS } from "../utils/billParser";

const router = Router();
const prisma = new PrismaClient();

const evaluateSchema = z.object({
  annualConsumptionKwh: z.number().positive(),
  currentLandedTariff: z.number().positive(),
  proposedEnergyTariff: z.number().positive(),
  transmissionChargePerKwh: z.number().min(0).default(0.28),
  wheelingChargePerKwh: z.number().min(0).default(0.72),
  crossSubsidySurchargePerKwh: z.number().min(0).default(0),
  additionalSurchargePerKwh: z.number().min(0).default(0),
  bankingChargesPerKwh: z.number().min(0).default(0.25),
  stuLossPercent: z.number().min(0).max(30).default(3.8),
  ctuLossPercent: z.number().min(0).max(30).default(0),
  sldcAndSchedulingChargePerKwh: z.number().min(0).default(0.05),
  contractedGreenSharePercent: z.number().min(0).max(100).default(80),
  applicableFixedCostAnnualInr: z.number().optional().default(0)
});

// Evaluate landed cost and savings calculation
router.post("/evaluate", (req: Request, res: Response): void => {
  try {
    const validated = evaluateSchema.parse(req.body);
    const results = calculateLandedCost(validated as LandedCostInputs);
    res.json({ success: true, data: results });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { code: "VALIDATION_FAILED", details: err.errors } });
      return;
    }
    console.error("Calculator error:", err);
    res.status(400).json({ success: false, error: { code: "CALCULATION_ERROR", message: err.message || "Failed to calculate" } });
  }
});

// Decompose utility bill into landed rate components
router.post("/bill-decompose", (req: Request, res: Response): void => {
  try {
    const {
      monthlyConsumptionKwh,
      contractDemandKva,
      energyChargesInr,
      fixedDemandChargesInr,
      todOrFuelSurchargesInr = 0,
      electricityDutyAndTaxesInr = 0
    } = req.body;

    const units = parseFloat(monthlyConsumptionKwh);
    if (!units || units <= 0) {
      res.status(400).json({ success: false, error: { code: "INVALID_UNITS", message: "Monthly consumption must be greater than 0" } });
      return;
    }

    const energy = parseFloat(energyChargesInr) || 0;
    const fixed = parseFloat(fixedDemandChargesInr) || 0;
    const surcharges = parseFloat(todOrFuelSurchargesInr) || 0;
    const taxes = parseFloat(electricityDutyAndTaxesInr) || 0;

    const totalBillInr = energy + fixed + surcharges + taxes;
    const landedCostPerKwh = totalBillInr / units;
    const baseEnergyCostPerKwh = energy / units;
    const demandChargePerKwhEquivalent = fixed / units;
    const taxesAndSurchargesPerKwh = (surcharges + taxes) / units;

    res.json({
      success: true,
      data: {
        totalBillInr: Math.round(totalBillInr),
        landedCostPerKwh: Number(landedCostPerKwh.toFixed(4)),
        baseEnergyCostPerKwh: Number(baseEnergyCostPerKwh.toFixed(4)),
        demandChargePerKwhEquivalent: Number(demandChargePerKwhEquivalent.toFixed(4)),
        taxesAndSurchargesPerKwh: Number(taxesAndSurchargesPerKwh.toFixed(4)),
        annualizedConsumptionKwh: Math.round(units * 12),
        annualizedExpenditureInr: Math.round(totalBillInr * 12)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to decompose bill" } });
  }
});

// Extract bill details from uploaded PDF, Image Base64, or Sample Presets
router.post("/extract-bill", async (req: Request, res: Response): Promise<void> => {
  try {
    const { fileName, fileType, base64Content, samplePreset } = req.body;
    const extracted = await extractBillDetails({
      fileName,
      fileType,
      base64Content,
      samplePreset
    });
    res.json({ success: true, data: extracted });
  } catch (err: any) {
    console.error("Bill extraction error:", err);
    res.status(400).json({ success: false, error: { code: "EXTRACTION_FAILED", message: err.message || "Failed to extract bill data" } });
  }
});

// List sample bill presets available for testing
router.get("/bill-samples", (_req: Request, res: Response): void => {
  res.json({
    success: true,
    data: Object.keys(SAMPLE_BILLS).map(key => ({
      presetKey: key,
      state: SAMPLE_BILLS[key].state,
      discomName: SAMPLE_BILLS[key].discomName,
      consumerName: SAMPLE_BILLS[key].consumerName,
      contractDemandKva: SAMPLE_BILLS[key].contractDemandKva,
      monthlyUnitsKwh: SAMPLE_BILLS[key].monthlyUnitsKwh,
      derivedLandedTariff: SAMPLE_BILLS[key].derivedLandedTariff
    }))
  });
});

// Get all supported states
router.get("/states", (_req: Request, res: Response): void => {
  res.json({
    success: true,
    data: Object.keys(STATE_REGULATORY_PROFILES)
  });
});

// Get regulatory rates and charges for a specific state
router.get("/state-rates/:state", (req: Request, res: Response): void => {
  const { state } = req.params;
  const profile = STATE_REGULATORY_PROFILES[state];

  if (!profile) {
    res.status(404).json({
      success: false,
      error: { code: "STATE_NOT_FOUND", message: `Regulatory profile for ${state} is not yet indexed.` }
    });
    return;
  }

  res.json({
    success: true,
    data: profile
  });
});

// Protected: Save a calculation scenario
router.post("/save", authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { scenarioName, state, annualKwh, existingTariff, proposedTariff, calculatedData } = req.body;

    if (!scenarioName || !annualKwh || !existingTariff || !proposedTariff) {
      res.status(400).json({ success: false, error: { code: "MISSING_FIELDS", message: "Incomplete scenario data" } });
      return;
    }

    const saved = await prisma.savedCalculation.create({
      data: {
        userId: req.user!.id,
        scenarioName,
        state: state || "Telangana",
        annualKwh: parseFloat(annualKwh),
        existingTariff: parseFloat(existingTariff),
        proposedTariff: parseFloat(proposedTariff),
        calculatedData: typeof calculatedData === "string" ? calculatedData : JSON.stringify(calculatedData)
      }
    });

    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    console.error("Save calculation error:", err);
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to save calculation" } });
  }
});

// Protected: Get saved calculations for current user
router.get("/saved", authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const saved = await prisma.savedCalculation.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" }
    });

    res.json({
      success: true,
      data: saved.map(s => ({
        ...s,
        calculatedData: JSON.parse(s.calculatedData)
      }))
    });
  } catch (err) {
    console.error("Get saved calculations error:", err);
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch saved calculations" } });
  }
});

export default router;
