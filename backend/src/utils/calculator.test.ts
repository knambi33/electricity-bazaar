import { describe, it, expect } from "vitest";
import { calculateLandedCost, LandedCostInputs } from "./calculator";

describe("Electricity Procurement Economics Calculator Engine", () => {
  const baseTelanganaInputs: LandedCostInputs = {
    annualConsumptionKwh: 12000000, // 12 MU
    currentLandedTariff: 8.50, // Rs 8.50/kWh
    proposedEnergyTariff: 3.60, // Rs 3.60/kWh ex-busbar
    transmissionChargePerKwh: 0.28,
    wheelingChargePerKwh: 0.72,
    crossSubsidySurchargePerKwh: 1.98,
    additionalSurchargePerKwh: 0.45,
    bankingChargesPerKwh: 0.25,
    stuLossPercent: 3.8, // 3.8%
    ctuLossPercent: 0.0, // Intra-state
    sldcAndSchedulingChargePerKwh: 0.05,
    contractedGreenSharePercent: 80.0
  };

  it("accurately computes landed cost with STU loss gross-up for Third-Party Open Access", () => {
    const result = calculateLandedCost(baseTelanganaInputs);

    // Existing expenditure = 12M * 8.50 = 102,000,000 INR
    expect(result.existingAnnualExpenditureInr).toBe(102000000);

    // Loss multiplier = 1 / (1 - 0.038) = 1 / 0.9620 = 1.039501...
    expect(result.effectiveLossFactor).toBeCloseTo(1.0395, 3);

    // Grossed up energy tariff = 3.60 * 1.039501 = 3.7422
    expect(result.openAccessEnergyTariffGrossedUp).toBeCloseTo(3.7422, 2);

    // Total OA Landed Cost = 3.7422 + (0.28 + 0.72 + 1.98 + 0.45 + 0.25 + 0.05) = 3.7422 + 3.73 = 7.4722
    expect(result.totalOpenAccessLandedCostPerKwh).toBeCloseTo(7.4722, 2);

    // Blended tariff (80% OA @ 7.4722 + 20% Grid @ 8.50)
    // = (7.4722 * 0.8) + (8.50 * 0.2) = 5.9778 + 1.70 = 7.6778
    expect(result.blendedLandedTariffPerKwh).toBeCloseTo(7.6778, 2);

    // Net savings: 102,000,000 - (12M * 7.6778) > 0
    expect(result.annualSavingsInr).toBeGreaterThan(0);
    expect(result.savingsPercentage).toBeGreaterThan(9.0);
  });

  it("models Group Captive statutory CSS and Additional Surcharge exemption correctly", () => {
    const groupCaptiveInputs: LandedCostInputs = {
      ...baseTelanganaInputs,
      crossSubsidySurchargePerKwh: 0.0, // Statutory waiver under Electricity Act Sec 42(2)
      additionalSurchargePerKwh: 0.0,
      contractedGreenSharePercent: 100.0
    };

    const result = calculateLandedCost(groupCaptiveInputs);

    // Total OA Landed = 3.7422 + (0.28 + 0.72 + 0 + 0 + 0.25 + 0.05) = 3.7422 + 1.30 = 5.0422
    expect(result.totalOpenAccessLandedCostPerKwh).toBeCloseTo(5.0422, 2);
    expect(result.blendedLandedTariffPerKwh).toBeCloseTo(5.0422, 2);

    // Net unit saving = 8.50 - 5.0422 = ~3.46 Rs/kWh
    expect(result.costDifferencePerKwh).toBeCloseTo(3.4578, 2);

    // Total annual saving on 12 MU = ~41.5 Million INR
    expect(result.annualSavingsInr).toBeGreaterThan(41000000);
    expect(result.savingsPercentage).toBeGreaterThan(40.0);
  });

  it("calculates break-even tariff accurately", () => {
    const result = calculateLandedCost(baseTelanganaInputs);
    // At break-even PPA tariff, OA Landed cost must equal Current Landed Tariff (8.50)
    const breakEvenResult = calculateLandedCost({
      ...baseTelanganaInputs,
      proposedEnergyTariff: result.breakEvenEnergyTariffPerKwh,
      contractedGreenSharePercent: 100
    });

    expect(breakEvenResult.totalOpenAccessLandedCostPerKwh).toBeCloseTo(baseTelanganaInputs.currentLandedTariff, 2);
    expect(breakEvenResult.annualSavingsInr).toBeCloseTo(0, -3); // Within 1000 INR
  });

  it("throws error for zero or negative annual consumption", () => {
    expect(() => calculateLandedCost({ ...baseTelanganaInputs, annualConsumptionKwh: 0 })).toThrow(
      "Annual consumption must be strictly greater than 0 kWh"
    );
    expect(() => calculateLandedCost({ ...baseTelanganaInputs, annualConsumptionKwh: -500 })).toThrow(
      "Annual consumption must be strictly greater than 0 kWh"
    );
  });

  it("throws error for negative tariff inputs", () => {
    expect(() => calculateLandedCost({ ...baseTelanganaInputs, proposedEnergyTariff: -2.5 })).toThrow(
      "Tariff values cannot be negative"
    );
  });

  it("generates a 5-point sensitivity table with positive and negative deviations", () => {
    const result = calculateLandedCost(baseTelanganaInputs);
    expect(result.sensitivityAnalysis).toHaveLength(5);
    expect(result.sensitivityAnalysis[0].proposedEnergyTariff).toBeGreaterThan(baseTelanganaInputs.proposedEnergyTariff);
    expect(result.sensitivityAnalysis[4].proposedEnergyTariff).toBeLessThan(baseTelanganaInputs.proposedEnergyTariff);
  });
});
