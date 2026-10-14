import { describe, it, expect } from "vitest";
import { parseTextToBillData, extractBillDetails, parseTamilNaduBill, parseTelanganaBill, SAMPLE_BILLS } from "../utils/billParser";

describe("Electricity Bill Parser Engine", () => {
  it("should extract accurate data for Tamil Nadu TANGEDCO bill preset", async () => {
    const data = await extractBillDetails({ samplePreset: "sample_tn_tangedco" });
    expect(data.state).toBe("Tamil Nadu");
    expect(data.discomName).toContain("TANGEDCO");
    expect(data.contractDemandKva).toBe(4200);
    expect(data.monthlyUnitsKwh).toBe(850000);
    expect(data.derivedLandedTariff).toBe(8.75);
    expect(data.totalBillInr).toBe(7437500);
  });

  it("should extract accurate data for authentic Tamil Nadu HVF Avadi bill", () => {
    const billText = `
      TamilNadu Power Distribution Corporation Ltd.
      Chennai West
      High Tension Bill (Provisional) for the Month of October 2025
      Service No. 019094061095
      Bill No. H4061095102511
      Date of Bill 06-Nov-25
      Permitted MD : 14100 KVA
      Supply Voltage: 110 KV
      Tariff App. / Bld. HT IIA1 / HT IIA1
      To: THE GENL.MANAGER (HEAVY VEHICLES FACTORY AVADI MADRAS
      1. Industrial Consumption 7.75 per unit 1140111 88,35,860.25
      6. Quarters Consumption 8.8 per unit 671622 59,10,273.60
      9. Total Energy Charges 1,57,58,254.01
      10. Demand Charges 608 per KVA 12690 77,15,520.00
      11. Total Demand and Energy Charges 2,34,73,774.01
      Net Amount Payable 2,53,66,945.00
    `;

    const parsed = parseTextToBillData(billText, "HVF Bill for Oct 25.pdf");
    expect(parsed.state).toBe("Tamil Nadu");
    expect(parsed.consumerNumber).toBe("019094061095");
    expect(parsed.consumerName).toContain("Heavy Vehicles Factory");
    expect(parsed.contractDemandKva).toBe(14100);
    expect(parsed.monthlyUnitsKwh).toBe(1811733);
    expect(parsed.monthlyEnergyChargeInr).toBe(15758254);
    expect(parsed.monthlyDemandChargeInr).toBe(7715520);
    expect(parsed.totalBillInr).toBe(25366945);
    expect(parsed.derivedLandedTariff).toBe(14.00);
  });

  it("should extract accurate data for authentic Telangana S R Float Glass bill", () => {
    const billText = `
      SOUTHERN POWER DISTRIBUTION COMPANY OF TG LIMITED
      HT C.C. Bill for the month of August 2026, Date: 01-Sep-26
      Contracted MD (KVA/HP) 480 | Consumer No. HBG3681 
      Specified Voltage (KV) 11 | Name S R FLOAT GLASS 
      Category 1A | ADDRESS3 IDA NACHARAM 
      Total Consumption 30183.00
      Main Consumption 31226.00
      Demand Charges Normal Rs.500 464 232000.00
      Demand Charges Penal Rs.1000 32.09333 32093.33
      Energy Charges Ps.765 31226 238878.90
      Total Amount Payable | 512940
    `;

    const parsed = parseTextToBillData(billText, "TelanganaSPDCL SR Float Glass Aug 2026 HBG3681.pdf");
    expect(parsed.state).toBe("Telangana");
    expect(parsed.consumerNumber).toBe("HBG3681");
    expect(parsed.consumerName).toBe("S R FLOAT GLASS");
    expect(parsed.contractDemandKva).toBe(480);
    expect(parsed.monthlyUnitsKwh).toBe(31226);
    expect(parsed.monthlyEnergyChargeInr).toBe(238879);
    expect(parsed.monthlyDemandChargeInr).toBe(264093);
    expect(parsed.totalBillInr).toBe(512940);
    expect(parsed.derivedLandedTariff).toBe(16.43);
  });
});
