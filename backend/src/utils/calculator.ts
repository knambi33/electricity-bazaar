/**
 * Electricity Procurement Economics Calculator Engine
 * 
 * Accurately models Indian Open Access Landed Cost Economics.
 * Implements proper gross-up for transmission and distribution losses:
 * If a consumer requires E_delivered units, the energy injected at generation bus is:
 * E_injected = E_delivered / ((1 - Loss_CTU) * (1 - Loss_STU))
 */

export interface LandedCostInputs {
  annualConsumptionKwh: number;
  currentLandedTariff: number; // In Rs/kWh from current utility bill
  proposedEnergyTariff: number; // In Rs/kWh ex-busbar from generator
  transmissionChargePerKwh: number; // In Rs/kWh
  wheelingChargePerKwh: number; // In Rs/kWh
  crossSubsidySurchargePerKwh: number; // CSS in Rs/kWh (0 for Group Captive)
  additionalSurchargePerKwh: number; // AS in Rs/kWh (0 for Group Captive)
  bankingChargesPerKwh: number; // In Rs/kWh
  stuLossPercent: number; // State transmission loss % (e.g. 3.8%)
  ctuLossPercent: number; // Inter-state CTU loss % (e.g. 3.2% if inter-state, 0 if intra-state)
  sldcAndSchedulingChargePerKwh: number; // Scheduling / SLDC / RLDC fees
  contractedGreenSharePercent: number; // % of consumption shifted to renewable (e.g. 80%)
  applicableFixedCostAnnualInr?: number; // Annualized fixed network or PPA retainer fees
}

export interface LandedCostOutputs {
  existingAnnualExpenditureInr: number;
  openAccessEnergyTariffGrossedUp: number; // Tariff adjusted for losses
  totalOpenAccessLandedCostPerKwh: number; // Total landed Rs/kWh for OA power
  blendedLandedTariffPerKwh: number; // Blended tariff across OA + remaining grid power
  proposedAnnualExpenditureInr: number;
  costDifferencePerKwh: number; // Existing - Blended (Positive = Saving)
  annualSavingsInr: number; // Positive = Net saving, Negative = Net extra cost
  savingsPercentage: number;
  breakEvenEnergyTariffPerKwh: number; // PPA tariff where landed cost equals current utility tariff
  effectiveLossFactor: number; // Total combined loss multiplier
  assumptions: string[];
  sensitivityAnalysis: Array<{
    scenario: string;
    energyTariffAdjustment: string;
    proposedEnergyTariff: number;
    blendedLandedTariff: number;
    annualSavingsInr: number;
  }>;
}

/**
 * Calculates landed cost and financial comparison between current utility tariff and open access / group captive power.
 */
export function calculateLandedCost(inputs: LandedCostInputs): LandedCostOutputs {
  // Guard against invalid or zero consumption
  if (inputs.annualConsumptionKwh <= 0) {
    throw new Error("Annual consumption must be strictly greater than 0 kWh");
  }
  if (inputs.currentLandedTariff < 0 || inputs.proposedEnergyTariff < 0) {
    throw new Error("Tariff values cannot be negative");
  }

  const greenShare = Math.min(Math.max(inputs.contractedGreenSharePercent / 100, 0), 1);
  const remainingGridShare = 1 - greenShare;

  // Existing annual electricity expenditure
  const existingAnnualExpenditureInr = inputs.annualConsumptionKwh * inputs.currentLandedTariff;

  // Transmission and distribution loss calculations:
  // Base formula: Delivered Energy = Injected Energy * (1 - CTU_Loss) * (1 - STU_Loss)
  // Loss multiplier = 1 / ((1 - CTU_Loss) * (1 - STU_Loss))
  const ctuLossRatio = Math.max(0, Math.min(inputs.ctuLossPercent / 100, 0.5));
  const stuLossRatio = Math.max(0, Math.min(inputs.stuLossPercent / 100, 0.5));
  
  const transmissionRetainedFraction = (1 - ctuLossRatio) * (1 - stuLossRatio);
  const lossMultiplier = transmissionRetainedFraction > 0 ? (1 / transmissionRetainedFraction) : 1;

  // Grossed-up energy tariff at consumer meter
  const openAccessEnergyTariffGrossedUp = inputs.proposedEnergyTariff * lossMultiplier;

  // Total Open Access Landed Cost per kWh (Energy adjusted for loss + network charges + surcharges + SLDC)
  const networkAndSurchargesPerKwh = 
    inputs.transmissionChargePerKwh +
    inputs.wheelingChargePerKwh +
    inputs.crossSubsidySurchargePerKwh +
    inputs.additionalSurchargePerKwh +
    inputs.bankingChargesPerKwh +
    inputs.sldcAndSchedulingChargePerKwh;

  const totalOpenAccessLandedCostPerKwh = openAccessEnergyTariffGrossedUp + networkAndSurchargesPerKwh;

  // Blended Landed Cost per kWh (Weighted average of Open Access green share + remaining Grid share)
  const blendedLandedTariffPerKwh = (totalOpenAccessLandedCostPerKwh * greenShare) + (inputs.currentLandedTariff * remainingGridShare);

  const fixedCost = inputs.applicableFixedCostAnnualInr || 0;
  const proposedAnnualExpenditureInr = (inputs.annualConsumptionKwh * blendedLandedTariffPerKwh) + fixedCost;

  const costDifferencePerKwh = inputs.currentLandedTariff - blendedLandedTariffPerKwh;
  const annualSavingsInr = existingAnnualExpenditureInr - proposedAnnualExpenditureInr;
  const savingsPercentage = existingAnnualExpenditureInr > 0 ? (annualSavingsInr / existingAnnualExpenditureInr) * 100 : 0;

  // Break-even PPA tariff (ex-busbar tariff where Total OA Landed Cost = Current Landed Tariff)
  // Current Tariff = (PPA_breakeven * lossMultiplier) + networkAndSurchargesPerKwh
  // PPA_breakeven = (Current Tariff - networkAndSurchargesPerKwh) / lossMultiplier
  const breakEvenEnergyTariffPerKwh = Math.max(0, (inputs.currentLandedTariff - networkAndSurchargesPerKwh) / lossMultiplier);

  // Assumptions documentation
  const assumptions: string[] = [
    `Energy loss multiplier is ${lossMultiplier.toFixed(4)}x based on CTU loss of ${inputs.ctuLossPercent}% and STU loss of ${inputs.stuLossPercent}%.`,
    `Cross-Subsidy Surcharge (CSS) is ₹${inputs.crossSubsidySurchargePerKwh.toFixed(2)}/kWh (exempt under 100% Group Captive structures).`,
    `Additional Surcharge (AS) is ₹${inputs.additionalSurchargePerKwh.toFixed(2)}/kWh.`,
    `Contracted renewable share is ${inputs.contractedGreenSharePercent}%, with ${Math.round(remainingGridShare * 100)}% balancing drawn from local DISCOM at ₹${inputs.currentLandedTariff.toFixed(2)}/kWh.`,
    "All calculations are indicative estimates under CERC/SERC tariff regulations and do not constitute guaranteed commercial savings."
  ];

  // Sensitivity analysis: +/- 10% and +/- 5% tariff changes
  const sensitivityVariations = [
    { label: "High Generation Tariff (+10%)", factor: 1.10 },
    { label: "Moderate Generation Tariff (+5%)", factor: 1.05 },
    { label: "Base Case Proposal (0%)", factor: 1.00 },
    { label: "Competitive Generation Tariff (-5%)", factor: 0.95 },
    { label: "Optimal Generation Tariff (-10%)", factor: 0.90 }
  ];

  const sensitivityAnalysis = sensitivityVariations.map(variation => {
    const adjustedEnergyTariff = inputs.proposedEnergyTariff * variation.factor;
    const adjustedOaLanded = (adjustedEnergyTariff * lossMultiplier) + networkAndSurchargesPerKwh;
    const adjustedBlended = (adjustedOaLanded * greenShare) + (inputs.currentLandedTariff * remainingGridShare);
    const adjustedAnnualExpenditure = (inputs.annualConsumptionKwh * adjustedBlended) + fixedCost;
    const adjustedSavings = existingAnnualExpenditureInr - adjustedAnnualExpenditure;

    return {
      scenario: variation.label,
      energyTariffAdjustment: `${variation.factor >= 1 ? '+' : ''}${Math.round((variation.factor - 1) * 100)}%`,
      proposedEnergyTariff: Number(adjustedEnergyTariff.toFixed(2)),
      blendedLandedTariff: Number(adjustedBlended.toFixed(2)),
      annualSavingsInr: Math.round(adjustedSavings)
    };
  });

  return {
    existingAnnualExpenditureInr: Math.round(existingAnnualExpenditureInr),
    openAccessEnergyTariffGrossedUp: Number(openAccessEnergyTariffGrossedUp.toFixed(4)),
    totalOpenAccessLandedCostPerKwh: Number(totalOpenAccessLandedCostPerKwh.toFixed(4)),
    blendedLandedTariffPerKwh: Number(blendedLandedTariffPerKwh.toFixed(4)),
    proposedAnnualExpenditureInr: Math.round(proposedAnnualExpenditureInr),
    costDifferencePerKwh: Number(costDifferencePerKwh.toFixed(4)),
    annualSavingsInr: Math.round(annualSavingsInr),
    savingsPercentage: Number(savingsPercentage.toFixed(2)),
    breakEvenEnergyTariffPerKwh: Number(breakEvenEnergyTariffPerKwh.toFixed(4)),
    effectiveLossFactor: Number(lossMultiplier.toFixed(4)),
    assumptions,
    sensitivityAnalysis
  };
}
