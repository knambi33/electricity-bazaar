import { describe, it, expect } from "vitest";
import { parseTextToBillData, extractBillDetails, SAMPLE_BILLS } from "../utils/billParser";

describe("Electricity Bill Parser Engine", () => {
  it("should extract accurate data for Tamil Nadu TANGEDCO bill preset", async () => {
    const data = await extractBillDetails({ samplePreset: "sample_tn_tangedco" });
    expect(data.state).toBe("Tamil Nadu");
    expect(data.discomName).toContain("TANGEDCO");
    expect(data.contractDemandKva).toBe(4200);
    expect(data.monthlyUnitsKwh).toBe(850000);
    expect(data.derivedLandedTariff).toBe(8.75);
    expect(data.totalBillInr).toBe(7437500);
    expect(data.confidenceScore).toBeGreaterThanOrEqual(95);
  });

  it("should extract accurate data for Telangana TSSPDCL bill preset", async () => {
    const data = await extractBillDetails({ samplePreset: "sample_tg_tsspdcl" });
    expect(data.state).toBe("Telangana");
    expect(data.discomName).toContain("TSSPDCL");
    expect(data.contractDemandKva).toBe(3500);
    expect(data.monthlyUnitsKwh).toBe(720000);
    expect(data.derivedLandedTariff).toBe(10.39);
  });

  it("should parse text from typical TANGEDCO HT electricity bill", () => {
    const billText = `
      TAMIL NADU GENERATION AND DISTRIBUTION CORPORATION LIMITED (TANGEDCO)
      HT BILL CUM DISCONNECT NOTICE
      HT SC No: 0392049182 | Tariff: HT-I Industrial
      Consumer: Coimbatore Precision Auto Components & Foundry Ltd
      Sanctioned Demand: 4200 kVA | Recorded Demand: 3940 kVA
      Billed Units: 850000 kWh
      Energy Charges: Rs. 6120000.00
      Demand Charges: Rs. 1317500.00
      Total Bill Amount: Rs. 7437500.00
    `;

    const parsed = parseTextToBillData(billText, "coimbatore_tangedco_bill.pdf");
    expect(parsed.state).toBe("Tamil Nadu");
    expect(parsed.contractDemandKva).toBe(4200);
    expect(parsed.monthlyUnitsKwh).toBe(850000);
    expect(parsed.monthlyEnergyChargeInr).toBe(6120000);
    expect(parsed.monthlyDemandChargeInr).toBe(1317500);
    expect(parsed.totalBillInr).toBe(7437500);
    expect(parsed.derivedLandedTariff).toBe(8.75);
  });

  it("should parse text from typical TSSPDCL HT electricity bill", () => {
    const billText = `
      SOUTHERN POWER DISTRIBUTION COMPANY OF TELANGANA LIMITED (TSSPDCL)
      HT ELECTRICITY BILL FOR SEPTEMBER 2026
      USC No: HT-SC-RJN-1402 | Tariff: HT-I(A) Industrial
      Consumer Name: Hyderabad Bulk Drugs & Active Ingredients Ltd
      CMD: 3500 kVA | Recorded Demand: 3320 kVA
      Total Units: 720000 kWh
      Energy Charges: Rs. 5472000.00
      Demand Charges: Rs. 2008100.00
      Total Net Payable: Rs. 7480100.00
    `;

    const parsed = parseTextToBillData(billText, "hyderabad_tsspdcl_bill.png");
    expect(parsed.state).toBe("Telangana");
    expect(parsed.contractDemandKva).toBe(3500);
    expect(parsed.monthlyUnitsKwh).toBe(720000);
    expect(parsed.monthlyEnergyChargeInr).toBe(5472000);
    expect(parsed.totalBillInr).toBe(7480100);
    expect(parsed.derivedLandedTariff).toBe(10.39);
  });
});
