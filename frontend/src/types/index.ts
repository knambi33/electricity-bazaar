export type Role = 
  | 'BUYER_USER' 
  | 'BUYER_ADMIN' 
  | 'SELLER_USER' 
  | 'SELLER_ADMIN' 
  | 'SERVICE_PROVIDER' 
  | 'VERIFICATION_OFFICER' 
  | 'PLATFORM_ADMIN';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: Role;
}

export interface Organisation {
  id: string;
  legalName: string;
  tradeName?: string;
  registrationNumber?: string;
  orgType: string;
  verificationStatus: string;
  verificationNotes?: string;
  registeredState: string;
  headquartersAddress?: string;
  websiteUrl?: string;
}

export interface RenewableAssetDetail {
  id: string;
  technology: string;
  dcAcRatio?: number;
  cuFactorPercent?: number;
  expectedAnnualGenMu?: number;
  captiveStructureInfo?: string;
  bankingTerms?: string;
}

export interface StorageAssetDetail {
  id: string;
  storageType: string;
  powerCapacityMw: number;
  energyCapacityMwh: number;
  durationHours: number;
  roundTripEfficiencyPct?: number;
  chargingEnergySource?: string;
  commercialPricingModel?: string;
}

export interface MarketplaceListing {
  id: string;
  listingCode: string;
  organisationId: string;
  title: string;
  slug: string;
  category: string;
  commercialModel: string;
  state: string;
  projectLocation: string;
  totalCapacityMw: number;
  availableCapacityMw: number;
  indicativePricePerKwh?: number | null;
  priceBasisConditions?: string | null;
  contractDurationYears?: number | null;
  expectedAvailabilityDate: string;
  interconnectionType: string;
  substationDetails?: string | null;
  projectStatus: string;
  regulatoryApprovals?: string | null;
  isFeatured: boolean;
  status: string;
  isDemoData: boolean;
  viewCount: number;
  createdAt: string;
  organisation: {
    id: string;
    legalName: string;
    tradeName?: string;
    orgType?: string;
    verificationStatus: string;
    verificationNotes?: string;
    registeredState: string;
  };
  renewableDetails?: RenewableAssetDetail | null;
  storageDetails?: StorageAssetDetail | null;
}

export interface BuyerRequirement {
  id: string;
  requirementCode: string;
  organisationId: string;
  title: string;
  industryType: string;
  state: string;
  discomName: string;
  numberOfFacilities: number;
  contractDemandKva: number;
  sanctionedLoadKw: number;
  monthlyConsumptionKwh: number;
  currentSupplyCostPerKwh?: number | null;
  targetRenewablePercent: number;
  preferredTechnology?: string | null;
  commercialModel: string;
  requiredStartDate: string;
  contractTenureYears: number;
  openAccessPreference?: string | null;
  additionalNotes?: string | null;
  status: string;
  createdAt: string;
}

export interface MatchResult {
  listingId: string;
  listingCode: string;
  scorePercent: number;
  isViableMatch: boolean;
  matchReasons: string[];
  missingOrMismatchFactors: string[];
  listing: MarketplaceListing;
}

export interface EnquiryMessage {
  id: string;
  enquiryId: string;
  senderUserId: string;
  senderOrgId: string;
  senderName: string;
  messageText: string;
  createdAt: string;
}

export interface Enquiry {
  id: string;
  enquiryCode: string;
  listingId: string;
  buyerOrganisationId: string;
  sellerOrganisationId: string;
  requirementId?: string | null;
  proposedCapacityMw?: number | null;
  message: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  listing: {
    id: string;
    title: string;
    listingCode: string;
    state?: string;
    category?: string;
    availableCapacityMw?: number;
  };
  buyerOrganisation: {
    id: string;
    legalName: string;
    tradeName?: string;
    registeredState: string;
  };
  sellerOrganisation: {
    id: string;
    legalName: string;
    tradeName?: string;
    registeredState: string;
  };
  messages?: EnquiryMessage[];
}

export interface TenderOpportunity {
  id: string;
  tenderRefNo: string;
  issuingAuthority: string;
  tenderType: string;
  title: string;
  state: string;
  capacityMw?: number | null;
  estimatedValueInr?: number | null;
  submissionDeadline: string;
  sourceUrl: string;
  isVerifiedSource: boolean;
  isDemoData: boolean;
}

export interface ServiceListing {
  id: string;
  serviceCode: string;
  organisationId: string;
  title: string;
  category: string;
  description: string;
  geographicalCoverage: string;
  qualifications?: string | null;
  pricingModel?: string | null;
  status: string;
  isDemoData: boolean;
  organisation: {
    legalName: string;
    tradeName?: string;
    verificationStatus: string;
    registeredState: string;
  };
}

export interface LandedCostInputs {
  annualConsumptionKwh: number;
  currentLandedTariff: number;
  proposedEnergyTariff: number;
  transmissionChargePerKwh: number;
  wheelingChargePerKwh: number;
  crossSubsidySurchargePerKwh: number;
  additionalSurchargePerKwh: number;
  bankingChargesPerKwh: number;
  stuLossPercent: number;
  ctuLossPercent: number;
  sldcAndSchedulingChargePerKwh: number;
  contractedGreenSharePercent: number;
  applicableFixedCostAnnualInr?: number;
}

export interface LandedCostOutputs {
  existingAnnualExpenditureInr: number;
  openAccessEnergyTariffGrossedUp: number;
  totalOpenAccessLandedCostPerKwh: number;
  blendedLandedTariffPerKwh: number;
  proposedAnnualExpenditureInr: number;
  costDifferencePerKwh: number;
  annualSavingsInr: number;
  savingsPercentage: number;
  breakEvenEnergyTariffPerKwh: number;
  effectiveLossFactor: number;
  assumptions: string[];
  sensitivityAnalysis: Array<{
    scenario: string;
    energyTariffAdjustment: string;
    proposedEnergyTariff: number;
    blendedLandedTariff: number;
    annualSavingsInr: number;
  }>;
}

export interface StateRegulatoryProfile {
  state: string;
  discoms: string[];
  voltageLevels: Array<{
    level: string;
    typicalIndustrialTariffRsPerKwh: number;
    wheelingChargeRsPerKwh: number;
    crossSubsidySurchargeRsPerKwh: number;
    stuTransmissionLossPercent: number;
  }>;
  transmissionChargeRsPerKwh: number;
  additionalSurchargeRsPerKwh: number;
  bankingChargesRsPerKwh: number;
  sldcChargesRsPerKwh: number;
  groupCaptiveExemptions: {
    cssExempt: boolean;
    additionalSurchargeExempt: boolean;
    equityRequirementPercent: number;
    consumptionRequirementPercent: number;
  };
  effectiveTariffOrderDate: string;
  regulatoryAuthority: string;
  disclaimer: string;
}

export interface ExtractedBillField {
  field: string;
  value: string | number;
  confidence: 'HIGH' | 'MEDIUM' | 'INFERRED';
  sourceSnippet?: string;
}

export interface ExtractedBillData {
  state: string;
  discomName: string;
  consumerNumber: string;
  consumerName: string;
  billingMonth: string;
  tariffCategory: string;
  voltageLevel: string;
  contractDemandKva: number;
  recordedDemandKva?: number;
  monthlyUnitsKwh: number;
  monthlyEnergyChargeInr: number;
  monthlyDemandChargeInr: number;
  electricityDutyInr: number;
  fuelSurchargeInr: number;
  totalBillInr: number;
  derivedLandedTariff: number;
  confidenceScore: number;
  extractedFields: ExtractedBillField[];
  rawTextPreview?: string;
}
