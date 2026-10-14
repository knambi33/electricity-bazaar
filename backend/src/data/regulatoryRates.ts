/**
 * State-specific Regulatory Tariff Orders & Open Access Charge Master Data
 * Source: State Electricity Regulatory Commissions (SERCs) - TSERC, GERC, MERC, RERC, TNERC
 * All rates in INR / kWh unless otherwise noted.
 */

export interface StateRegulatoryProfile {
  state: string;
  discoms: string[];
  voltageLevels: Array<{
    level: string; // e.g. "11 kV", "33 kV", "132 kV"
    typicalIndustrialTariffRsPerKwh: number;
    wheelingChargeRsPerKwh: number;
    crossSubsidySurchargeRsPerKwh: number; // For Third-Party Open Access (0 for Group Captive)
    stuTransmissionLossPercent: number;
  }>;
  transmissionChargeRsPerKwh: number;
  additionalSurchargeRsPerKwh: number;
  bankingChargesRsPerKwh: number;
  sldcChargesRsPerKwh: number;
  groupCaptiveExemptions: {
    cssExempt: boolean;
    additionalSurchargeExempt: boolean;
    equityRequirementPercent: number; // 26%
    consumptionRequirementPercent: number; // 51%
  };
  effectiveTariffOrderDate: string;
  regulatoryAuthority: string;
  disclaimer: string;
}

export const STATE_REGULATORY_PROFILES: Record<string, StateRegulatoryProfile> = {
  Telangana: {
    state: "Telangana",
    discoms: ["TSSPDCL (Southern Power)", "TSNPDCL (Northern Power)"],
    voltageLevels: [
      {
        level: "11 kV",
        typicalIndustrialTariffRsPerKwh: 8.45,
        wheelingChargeRsPerKwh: 0.72,
        crossSubsidySurchargeRsPerKwh: 1.98,
        stuTransmissionLossPercent: 3.8
      },
      {
        level: "33 kV",
        typicalIndustrialTariffRsPerKwh: 7.95,
        wheelingChargeRsPerKwh: 0.42,
        crossSubsidySurchargeRsPerKwh: 1.72,
        stuTransmissionLossPercent: 3.4
      },
      {
        level: "132 kV and above",
        typicalIndustrialTariffRsPerKwh: 7.45,
        wheelingChargeRsPerKwh: 0.15,
        crossSubsidySurchargeRsPerKwh: 1.45,
        stuTransmissionLossPercent: 2.9
      }
    ],
    transmissionChargeRsPerKwh: 0.28,
    additionalSurchargeRsPerKwh: 0.45,
    bankingChargesRsPerKwh: 0.25,
    sldcChargesRsPerKwh: 0.05,
    groupCaptiveExemptions: {
      cssExempt: true,
      additionalSurchargeExempt: true,
      equityRequirementPercent: 26,
      consumptionRequirementPercent: 51
    },
    effectiveTariffOrderDate: "2026 TSERC Retail Supply & Open Access Order",
    regulatoryAuthority: "Telangana State Electricity Regulatory Commission (TSERC)",
    disclaimer: "Indicative statutory charges as per prevailing TSERC Retail Tariff and bi-annual Additional Surcharge orders."
  },

  Gujarat: {
    state: "Gujarat",
    discoms: ["DGVCL", "MGVCL", "PGVCL", "UGVCL", "Torrent Power"],
    voltageLevels: [
      {
        level: "11 kV",
        typicalIndustrialTariffRsPerKwh: 8.20,
        wheelingChargeRsPerKwh: 0.58,
        crossSubsidySurchargeRsPerKwh: 1.85,
        stuTransmissionLossPercent: 3.5
      },
      {
        level: "66 kV and above",
        typicalIndustrialTariffRsPerKwh: 7.50,
        wheelingChargeRsPerKwh: 0.22,
        crossSubsidySurchargeRsPerKwh: 1.40,
        stuTransmissionLossPercent: 2.8
      }
    ],
    transmissionChargeRsPerKwh: 0.32,
    additionalSurchargeRsPerKwh: 0.40,
    bankingChargesRsPerKwh: 0.20,
    sldcChargesRsPerKwh: 0.04,
    groupCaptiveExemptions: {
      cssExempt: true,
      additionalSurchargeExempt: true,
      equityRequirementPercent: 26,
      consumptionRequirementPercent: 51
    },
    effectiveTariffOrderDate: "2026 GERC Multi-Year Tariff Order",
    regulatoryAuthority: "Gujarat Electricity Regulatory Commission (GERC)",
    disclaimer: "Subject to GERC Open Access Regulations and Green Energy Open Access Policy."
  },

  Maharashtra: {
    state: "Maharashtra",
    discoms: ["MSEDCL (Mahavitaran)", "Tata Power Mumbai", "Adani Electricity"],
    voltageLevels: [
      {
        level: "11/22 kV",
        typicalIndustrialTariffRsPerKwh: 9.15,
        wheelingChargeRsPerKwh: 1.12,
        crossSubsidySurchargeRsPerKwh: 2.15,
        stuTransmissionLossPercent: 4.0
      },
      {
        level: "33 kV and above",
        typicalIndustrialTariffRsPerKwh: 8.60,
        wheelingChargeRsPerKwh: 0.55,
        crossSubsidySurchargeRsPerKwh: 1.85,
        stuTransmissionLossPercent: 3.2
      }
    ],
    transmissionChargeRsPerKwh: 0.38,
    additionalSurchargeRsPerKwh: 0.65,
    bankingChargesRsPerKwh: 0.30,
    sldcChargesRsPerKwh: 0.06,
    groupCaptiveExemptions: {
      cssExempt: true,
      additionalSurchargeExempt: true,
      equityRequirementPercent: 26,
      consumptionRequirementPercent: 51
    },
    effectiveTariffOrderDate: "2026 MERC Multi-Year Tariff Order",
    regulatoryAuthority: "Maharashtra Electricity Regulatory Commission (MERC)",
    disclaimer: "Calculations reflect MSEDCL HT Industrial tariff schedules."
  },

  Rajasthan: {
    state: "Rajasthan",
    discoms: ["JVVNL (Jaipur)", "AVVNL (Ajmer)", "JdVVNL (Jodhpur)"],
    voltageLevels: [
      {
        level: "11 kV",
        typicalIndustrialTariffRsPerKwh: 8.55,
        wheelingChargeRsPerKwh: 0.68,
        crossSubsidySurchargeRsPerKwh: 1.90,
        stuTransmissionLossPercent: 3.6
      },
      {
        level: "33 kV and above",
        typicalIndustrialTariffRsPerKwh: 8.05,
        wheelingChargeRsPerKwh: 0.35,
        crossSubsidySurchargeRsPerKwh: 1.55,
        stuTransmissionLossPercent: 3.0
      }
    ],
    transmissionChargeRsPerKwh: 0.30,
    additionalSurchargeRsPerKwh: 0.52,
    bankingChargesRsPerKwh: 0.22,
    sldcChargesRsPerKwh: 0.05,
    groupCaptiveExemptions: {
      cssExempt: true,
      additionalSurchargeExempt: true,
      equityRequirementPercent: 26,
      consumptionRequirementPercent: 51
    },
    effectiveTariffOrderDate: "2026 RERC Tariff Schedule",
    regulatoryAuthority: "Rajasthan Electricity Regulatory Commission (RERC)",
    disclaimer: "Includes specific concessions under Rajasthan Solar Energy Policy."
  },

  "Tamil Nadu": {
    state: "Tamil Nadu",
    discoms: [
      "TANGEDCO (Tamil Nadu Generation & Distribution Corp)",
      "TNPDCL (Chennai, Coimbatore, Madurai, Trichy Distribution Circles)"
    ],
    voltageLevels: [
      {
        level: "11/22 kV (HT-I Industrial)",
        typicalIndustrialTariffRsPerKwh: 8.75,
        wheelingChargeRsPerKwh: 0.88,
        crossSubsidySurchargeRsPerKwh: 2.12,
        stuTransmissionLossPercent: 3.9
      },
      {
        level: "33 kV (HT-I Heavy Industrial)",
        typicalIndustrialTariffRsPerKwh: 8.15,
        wheelingChargeRsPerKwh: 0.42,
        crossSubsidySurchargeRsPerKwh: 1.70,
        stuTransmissionLossPercent: 3.1
      },
      {
        level: "110 kV and above (EHT Industrial)",
        typicalIndustrialTariffRsPerKwh: 7.60,
        wheelingChargeRsPerKwh: 0.18,
        crossSubsidySurchargeRsPerKwh: 1.35,
        stuTransmissionLossPercent: 2.5
      },
      {
        level: "11/22 kV (HT-III Commercial & IT)",
        typicalIndustrialTariffRsPerKwh: 9.85,
        wheelingChargeRsPerKwh: 0.88,
        crossSubsidySurchargeRsPerKwh: 2.45,
        stuTransmissionLossPercent: 3.9
      }
    ],
    transmissionChargeRsPerKwh: 0.34,
    additionalSurchargeRsPerKwh: 0.55,
    bankingChargesRsPerKwh: 0.28,
    sldcChargesRsPerKwh: 0.05,
    groupCaptiveExemptions: {
      cssExempt: true,
      additionalSurchargeExempt: true,
      equityRequirementPercent: 26,
      consumptionRequirementPercent: 51
    },
    effectiveTariffOrderDate: "2026 TNERC Comprehensive Tariff & Multi-Year Open Access Order",
    regulatoryAuthority: "Tamil Nadu Electricity Regulatory Commission (TNERC)",
    disclaimer: "Applicable to HT/EHT consumers with contracted demand >= 63 kVA (HT-I/HT-III) or >= 100 kW for Green Energy Open Access (GEOA)."
  }
};
