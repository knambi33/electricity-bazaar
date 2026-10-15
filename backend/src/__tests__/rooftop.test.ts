import { describe, it, expect } from "vitest";
import { calculateTamilNaduRooftopEconomics, TAMIL_NADU_ROOFTOP_EPCS, TAMIL_NADU_ROOFTOP_CAMPAIGNS } from "../routes/rooftop";

describe("Tamil Nadu Rooftop Solar Economics Engine", () => {
  it("calculates individual home rooftop solar with PM Surya Ghar subsidy correctly", () => {
    // 3 kW residential rooftop for a homeowner with ₹4,500 monthly bill
    const result = calculateTamilNaduRooftopEconomics({
      applicantType: "INDIVIDUAL",
      monthlyBillInr: 4500,
      desiredCapacityKw: 3
    });

    expect(result.capacityKw).toBe(3);
    // Turnkey cost at ₹56,000/kW = ₹168,000
    expect(result.grossTurnkeyCost).toBe(168000);
    // PM Surya Ghar subsidy for 3 kW is ₹78,000 flat
    expect(result.centralSubsidyInr).toBe(78000);
    // Net payable: ₹168,000 - ₹78,000 = ₹90,000
    expect(result.netPayableInr).toBe(90000);
    // Annual units: 3 * 125 * 12 = 4,500 units
    expect(result.annualGenUnits).toBe(4500);
    // Annual savings at ~₹7.20/unit = ₹32,400
    expect(result.annualSavingsInr).toBe(32400);
    // Payback period: ~2.8 years
    expect(result.paybackYears).toBeLessThanOrEqual(3.5);
    expect(result.annualCo2MitigationTonnes).toBeGreaterThan(3.0);
  });

  it("calculates Apartment Association (RWA) common area rooftop solar with ₹18,000/kW subsidy", () => {
    // 40 kW common area rooftop for an apartment society with ₹80,000 monthly bill
    const result = calculateTamilNaduRooftopEconomics({
      applicantType: "APARTMENT_RWA",
      monthlyBillInr: 80000,
      desiredCapacityKw: 40
    });

    expect(result.capacityKw).toBe(40);
    // 40 kW turnkey at ₹52,000/kW = ₹2,080,000
    expect(result.grossTurnkeyCost).toBe(2080000);
    // PM Surya Ghar RWA subsidy: 40 * ₹18,000 = ₹720,000
    expect(result.centralSubsidyInr).toBe(720000);
    // Net payable: ₹2,080,000 - ₹720,000 = ₹1,360,000
    expect(result.netPayableInr).toBe(1360000);
    // Tariff 1D at ₹8.15/unit: 40 * 125 * 12 * 8.15 = ₹489,000 / yr savings
    expect(result.annualSavingsInr).toBe(489000);
    // Payback period: ~2.8 years
    expect(result.paybackYears).toBeLessThanOrEqual(3.5);
  });

  it("has verified Tamil Nadu EPC vendors and active community campaigns", () => {
    expect(TAMIL_NADU_ROOFTOP_EPCS.length).toBeGreaterThanOrEqual(5);
    const coimbatoreEpc = TAMIL_NADU_ROOFTOP_EPCS.find(e => e.registeredCity === "Coimbatore");
    expect(coimbatoreEpc).toBeDefined();
    expect(coimbatoreEpc?.mnreEmpanelled).toBe(true);

    const chennaiEpc = TAMIL_NADU_ROOFTOP_EPCS.find(e => e.registeredCity === "Chennai");
    expect(chennaiEpc).toBeDefined();
    expect(chennaiEpc?.tangedcoVendorRegistered).toBe(true);

    expect(TAMIL_NADU_ROOFTOP_CAMPAIGNS.length).toBeGreaterThanOrEqual(3);
  });
});
