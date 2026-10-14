/**
 * Deterministic Matching Engine
 * Evaluates compatibility between a Buyer Requirement and Marketplace Listings.
 * Generates transparent, human-readable match rationales without black-box scoring.
 */

export interface RequirementMatchCriteria {
  state: string;
  contractDemandMw: number; // In MW
  targetRenewablePercent: number;
  preferredTechnology?: string | null;
  commercialModel: string; // THIRD_PARTY_OPEN_ACCESS, GROUP_CAPTIVE, CAPTIVE, etc.
  requiredStartDate: Date | string;
}

export interface ListingMatchCandidate {
  id: string;
  listingCode: string;
  title: string;
  state: string;
  category: string;
  commercialModel: string;
  availableCapacityMw: number;
  totalCapacityMw: number;
  interconnectionType: string; // STU_INTRA_STATE, CTU_INTER_STATE, BEHIND_THE_METER
  projectStatus: string; // OPERATIONAL, READY_TO_BUILD, UNDER_CONSTRUCTION
  expectedAvailabilityDate: Date | string;
  indicativePricePerKwh?: number | null;
  organisation: {
    legalName: string;
    verificationStatus: string;
  };
  renewableDetails?: {
    technology: string;
    cuFactorPercent?: number | null;
  } | null;
  storageDetails?: {
    storageType: string;
    powerCapacityMw: number;
    energyCapacityMwh: number;
  } | null;
}

export interface MatchResult {
  listingId: string;
  listingCode: string;
  scorePercent: number; // 0 - 100
  isViableMatch: boolean;
  matchReasons: string[];
  missingOrMismatchFactors: string[];
}

export function evaluateListingMatch(
  requirement: RequirementMatchCriteria,
  listing: ListingMatchCandidate
): MatchResult {
  const matchReasons: string[] = [];
  const mismatchFactors: string[] = [];
  let score = 0;

  // 1. Geographical / Grid Interconnection Fit (Max 30 pts)
  const isSameState = requirement.state.toLowerCase().trim() === listing.state.toLowerCase().trim();
  const isCtu = listing.interconnectionType === "CTU_INTER_STATE";

  if (isSameState) {
    score += 30;
    matchReasons.push(`Direct State Grid Match: Located in ${listing.state} (Intra-state STU eligible).`);
  } else if (isCtu) {
    score += 22;
    matchReasons.push(`Inter-State Transmission: Generator is CTU-connected; eligible for inter-state green open access.`);
  } else {
    mismatchFactors.push(`Geographical Disconnect: Generator is in ${listing.state} on STU; cannot supply intra-state load in ${requirement.state}.`);
  }

  // 2. Capacity Fit (Max 25 pts)
  // Optimal match: Listing available capacity meets 50% - 150% of requirement demand
  const requiredMw = requirement.contractDemandMw;
  const availableMw = listing.availableCapacityMw;

  if (availableMw >= requiredMw * 0.8 && availableMw <= requiredMw * 1.5) {
    score += 25;
    matchReasons.push(`Optimal Capacity Alignment: Available ${availableMw} MW closely matches requirement of ${requiredMw} MW.`);
  } else if (availableMw > requiredMw * 1.5) {
    score += 20;
    matchReasons.push(`Substantial Capacity: ${availableMw} MW available can fully absorb ${requiredMw} MW requirement.`);
  } else if (availableMw >= requiredMw * 0.4) {
    score += 15;
    matchReasons.push(`Partial Capacity Fit: ${availableMw} MW available can meet ${Math.round((availableMw / requiredMw) * 100)}% of your load.`);
  } else {
    mismatchFactors.push(`Capacity Shortfall: Available capacity (${availableMw} MW) is below 40% of contracted demand (${requiredMw} MW).`);
  }

  // 3. Commercial Model Compatibility (Max 20 pts)
  if (requirement.commercialModel === listing.commercialModel) {
    score += 20;
    matchReasons.push(`Identical Commercial Structure: Both parties agree on ${listing.commercialModel.replace(/_/g, ' ')}.`);
  } else if (
    (requirement.commercialModel === "GROUP_CAPTIVE" && listing.commercialModel === "THIRD_PARTY_OPEN_ACCESS") ||
    (requirement.commercialModel === "THIRD_PARTY_OPEN_ACCESS" && listing.commercialModel === "GROUP_CAPTIVE")
  ) {
    score += 12;
    matchReasons.push(`Alternative Open Access Model: Listing offers ${listing.commercialModel.replace(/_/g, ' ')}, which is convertible with contract structuring.`);
  } else if (requirement.commercialModel === "IEX_EXCHANGE") {
    score += 15;
    matchReasons.push(`Power Market Intermediation: Listing generator / trader can facilitate exchange-cleared or bilateral hedging power.`);
  } else {
    score += 5;
    mismatchFactors.push(`Commercial Model Divergence: Buyer seeks ${requirement.commercialModel}, seller offers ${listing.commercialModel}.`);
  }

  // 4. Technology Fit (Max 15 pts)
  const reqTech = requirement.preferredTechnology?.toLowerCase() || "";
  const listingCategory = listing.category.toLowerCase();
  const assetTech = listing.renewableDetails?.technology?.toLowerCase() || "";

  if (!reqTech || reqTech.includes("any") || reqTech.includes("all")) {
    score += 15;
    matchReasons.push(`Open Technology: Any clean generation technology is acceptable.`);
  } else if (listingCategory.includes(reqTech) || assetTech.includes(reqTech)) {
    score += 15;
    matchReasons.push(`Direct Technology Match: Generation is ${listing.renewableDetails?.technology || listing.category}.`);
  } else if (listingCategory.includes("hybrid") || listingCategory.includes("rtc")) {
    score += 12;
    matchReasons.push(`Hybrid/RTC Advantage: Multi-technology generation provides superior firm power reliability.`);
  } else {
    score += 5;
    mismatchFactors.push(`Technology Difference: Buyer prefers ${requirement.preferredTechnology}, listing provides ${listing.category}.`);
  }

  // 5. Readiness & Timeline (Max 10 pts)
  const reqStart = new Date(requirement.requiredStartDate).getTime();
  const availDate = new Date(listing.expectedAvailabilityDate).getTime();

  if (listing.projectStatus === "OPERATIONAL") {
    score += 10;
    matchReasons.push(`Ready for Immediate Offtake: Plant is fully operational.`);
  } else if (availDate <= reqStart + (90 * 24 * 3600 * 1000)) {
    score += 8;
    matchReasons.push(`Timeline Concurrence: Commissioning date aligns within 90 days of requested supply date.`);
  } else {
    score += 3;
    mismatchFactors.push(`Commissioning Lead Time: Plant availability is slated for ${new Date(availDate).toLocaleDateString()}.`);
  }

  const isViableMatch = score >= 50 && (isSameState || isCtu);

  return {
    listingId: listing.id,
    listingCode: listing.listingCode,
    scorePercent: Math.min(100, score),
    isViableMatch,
    matchReasons,
    missingOrMismatchFactors: mismatchFactors
  };
}
