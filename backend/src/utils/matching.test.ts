import { describe, it, expect } from "vitest";
import { evaluateListingMatch, RequirementMatchCriteria, ListingMatchCandidate } from "./matching";

describe("Deterministic Matchmaking Engine", () => {
  const mockRequirement: RequirementMatchCriteria = {
    state: "Telangana",
    contractDemandMw: 5.0,
    targetRenewablePercent: 80.0,
    preferredTechnology: "Solar",
    commercialModel: "GROUP_CAPTIVE",
    requiredStartDate: new Date("2026-11-01")
  };

  const highMatchListing: ListingMatchCandidate = {
    id: "lst-001",
    listingCode: "LST-TG-SOL-01",
    title: "5 MW Solar Ground-Mounted Project - Mahbubnagar",
    state: "Telangana",
    category: "SOLAR_POWER",
    commercialModel: "GROUP_CAPTIVE",
    availableCapacityMw: 5.0,
    totalCapacityMw: 10.0,
    interconnectionType: "STU_INTRA_STATE",
    projectStatus: "OPERATIONAL",
    expectedAvailabilityDate: new Date("2026-10-01"),
    organisation: {
      legalName: "Deccan Green Energy Developers Ltd",
      verificationStatus: "VERIFIED_FOR_STATED_SCOPE"
    },
    renewableDetails: {
      technology: "Solar Mono-PERC Bifacial",
      cuFactorPercent: 24.5
    }
  };

  const mismatchedListing: ListingMatchCandidate = {
    id: "lst-002",
    listingCode: "LST-RJ-WND-02",
    title: "20 MW Wind Power Plant - Jaisalmer",
    state: "Rajasthan",
    category: "WIND_POWER",
    commercialModel: "CAPEX_SALE",
    availableCapacityMw: 20.0,
    totalCapacityMw: 20.0,
    interconnectionType: "STU_INTRA_STATE", // STU in Rajasthan cannot serve Telangana load
    projectStatus: "ADVANCED_DEVELOPMENT",
    expectedAvailabilityDate: new Date("2027-12-01"),
    organisation: {
      legalName: "Desert Wind Power LLP",
      verificationStatus: "UNVERIFIED"
    }
  };

  it("yields high score and positive rationales for matching geography, model, tech and capacity", () => {
    const result = evaluateListingMatch(mockRequirement, highMatchListing);
    expect(result.scorePercent).toBeGreaterThanOrEqual(90);
    expect(result.isViableMatch).toBe(true);
    expect(result.matchReasons).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Direct State Grid Match"),
        expect.stringContaining("Optimal Capacity Alignment"),
        expect.stringContaining("Identical Commercial Structure"),
        expect.stringContaining("Direct Technology Match")
      ])
    );
    expect(result.missingOrMismatchFactors).toHaveLength(0);
  });

  it("identifies geographical and commercial disconnects for mismatched listings", () => {
    const result = evaluateListingMatch(mockRequirement, mismatchedListing);
    expect(result.scorePercent).toBeLessThan(50);
    expect(result.isViableMatch).toBe(false);
    expect(result.missingOrMismatchFactors).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Geographical Disconnect"),
        expect.stringContaining("Commercial Model Divergence")
      ])
    );
  });
});
