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
  isConfidential?: boolean;
  ndaRequired?: boolean;
  landAreaAcres?: number | null;
  bayCapacityMw?: number | null;
  substationVoltageKv?: number | null;
  maskedLocation?: string;
  isMaskedForPrivacy?: boolean;
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

export interface TimeOfUseSlot {
  slot: string; // "C24", "C1", "C2", "C3", "C4", "C5"
  description: string;
  grossConsumptionKwh: number;
  solarAdjustedKwh: number;
  netBilledKwh: number;
}

export interface ExistingProcurementSource {
  source: string;
  adjustedKwh: number;
  percentOfGross: number;
  status: "ACTIVE" | "AVAILABLE_UNUTILIZED";
}

export interface OpenAccessChargesSummary {
  transmissionChargesInr: number;
  systemOperationChargesInr: number;
  schedulingChargesInr: number;
  dsmChargesInr: number;
  totalOaChargesInr: number;
  isExistingOpenAccessConsumer: boolean;
}

export interface SmartProcurementRecommendation {
  strategyTitle: string;
  category: "WIND_HYBRID" | "SOLAR_CAPTIVE" | "IEX_EXCHANGE" | "BESS_STORAGE";
  recommendedCapacityMw: number;
  targetTimeSlot: string;
  unsuppliedKwhTarget: number;
  potentialMonthlySavingsInr: number;
  potentialAnnualSavingsInr: number;
  rationale: string;
  actionCta: string;
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
  grossCampusConsumptionKwh?: number;
  monthlyEnergyChargeInr: number;
  monthlyDemandChargeInr: number;
  electricityDutyInr: number;
  fuelSurchargeInr: number;
  totalBillInr: number;
  derivedLandedTariff: number;
  confidenceScore: number;
  powerFactor?: number;
  timeOfUseSlots?: TimeOfUseSlot[];
  existingProcurementSources?: ExistingProcurementSource[];
  openAccessChargesSummary?: OpenAccessChargesSummary;
  smartProcurementRecommendations?: SmartProcurementRecommendation[];
  extractedFields: ExtractedBillField[];
  rawTextPreview?: string;
}

export type RooftopApplicantType = "INDIVIDUAL" | "APARTMENT_OWNER" | "APARTMENT_RWA" | "COMMERCIAL";

export interface RooftopEconomics {
  capacityKw: number;
  monthlyGenUnits: number;
  annualGenUnits: number;
  grossTurnkeyCost: number;
  centralSubsidyInr: number;
  netPayableInr: number;
  monthlySavingsInr: number;
  annualSavingsInr: number;
  paybackYears: number;
  lifetime25YrSavingsInr: number;
  annualCo2MitigationTonnes: number;
  subsidyProgram: string;
}

export interface RooftopVendor {
  id: string;
  name: string;
  tradeName: string;
  registeredCity: string;
  coveredDistricts: string[];
  experienceYears: number;
  rooftopProjectsCompleted: number;
  totalInstalledCapacityMw: number;
  mnreEmpanelled: boolean;
  tangedcoVendorRegistered: boolean;
  specialization: string[];
  rating: number;
  reviewCount: number;
  warrantyOffered: string;
  turnkeyRatePerWattInr: number;
  badge: string;
  contactEmail: string;
  phone: string;
  headquarters: string;
}

export interface RooftopCampaign {
  id: string;
  title: string;
  tagline: string;
  targetAudience: string;
  coverageArea: string;
  validTill: string;
  discountOffer: string;
  highlights: string[];
  subsidyScheme: string;
  ctaText: string;
}

export interface EpcApplicationDossier {
  portalSchemeName: string;
  nationalPortalUrl: string;
  stateDiscomPortalUrl: string;
  consumerName: string;
  consumerNumber: string;
  discomName: string;
  tariffCategory: string;
  sanctionedLoadKw: number;
  monthlyAverageKwh: number;
  proposedPlantCapacityKw: number;
  moduleTechnology: string;
  inverterSpecification: string;
  applicableCentralSubsidyInr: number;
  applicableStateSubsidyInr: number;
  netPayableAfterSubsidiesInr: number;
  billDocumentAttached: boolean;
  billFileName?: string;
  filingChecklist: string[];
}

export interface RooftopProposal {
  id: string;
  proposalCode: string;
  applicantType: RooftopApplicantType;
  fullName: string;
  phone: string;
  email: string;
  city: string;
  district: string;
  state: string;
  apartmentName?: string;
  numberOfFlats?: number;
  ebConsumerNumber?: string;
  discomName?: string;
  tariffCategory?: string;
  monthlyUnitsKwh?: number;
  monthlyBillInr: number;
  sanctionedLoadKw?: number;
  availableRoofAreaSqFt: number;
  roofType: "RCC_FLAT" | "SLOPED_SHEET" | "TILED" | "OTHER";
  recommendedCapacityKw: number;
  estimatedTurnkeyCostInr: number;
  applicableSubsidyInr: number;
  stateSubsidyInr?: number;
  netPayableInr: number;
  annualSavingsInr: number;
  preferredModel: "CAPEX" | "RESCO_OPEX";
  targetEpcVendorIds: string[];
  status: "SUBMITTED" | "FORWARDED_TO_EPCS" | "SITE_SURVEY_SCHEDULED" | "QUOTED" | "COMPLETED";
  billFileName?: string;
  billFileType?: string;
  billAttached?: boolean;
  notes?: string;
  dossierForEpc?: EpcApplicationDossier;
  createdAt: string;
}

export interface CampaignSignup {
  id: string;
  campaignId: string;
  societyName: string;
  associationRegNumber?: string;
  secretaryName: string;
  contactPhone: string;
  contactEmail: string;
  city: string;
  numberOfUnits: number;
  estimatedCommonAreaLoadKw: number;
  preferredDateForOrientation: string;
  status: "REGISTERED" | "ORIENTATION_SCHEDULED" | "EPC_PROPOSALS_PREPARED";
  createdAt: string;
}
