import { Router, Request, Response } from "express";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

// In-memory store for rooftop proposals & campaign registrations if SQLite table is not migrated yet
interface RooftopProposalRecord {
  id: string;
  proposalCode: string;
  applicantType: "INDIVIDUAL" | "APARTMENT_OWNER" | "APARTMENT_RWA" | "COMMERCIAL";
  fullName: string;
  phone: string;
  email: string;
  city: string;
  district: string;
  state: string;
  apartmentName?: string;
  numberOfFlats?: number;
  ebConsumerNumber?: string;
  monthlyBillInr: number;
  sanctionedLoadKw?: number;
  availableRoofAreaSqFt: number;
  roofType: "RCC_FLAT" | "SLOPED_SHEET" | "TILED" | "OTHER";
  recommendedCapacityKw: number;
  estimatedTurnkeyCostInr: number;
  applicableSubsidyInr: number;
  netPayableInr: number;
  annualSavingsInr: number;
  preferredModel: "CAPEX" | "RESCO_OPEX";
  targetEpcVendorIds: string[];
  status: "SUBMITTED" | "FORWARDED_TO_EPCS" | "SITE_SURVEY_SCHEDULED" | "QUOTED" | "COMPLETED";
  notes?: string;
  createdAt: string;
}

interface CampaignSignupRecord {
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

// Seeded verified EPC Vendors operating in Tamil Nadu
export const TAMIL_NADU_ROOFTOP_EPCS = [
  {
    id: "epc-tn-01",
    name: "Kongu Solar & Energy Infrastructure LLP",
    tradeName: "Kongu Solar EPC",
    registeredCity: "Coimbatore",
    coveredDistricts: ["Coimbatore", "Tiruppur", "Erode", "Salem", "Nilgiris"],
    experienceYears: 12,
    rooftopProjectsCompleted: 380,
    totalInstalledCapacityMw: 14.5,
    mnreEmpanelled: true,
    tangedcoVendorRegistered: true,
    specialization: ["Apartment Common Area Solar", "Individual Villas", "Factory Sheds"],
    rating: 4.9,
    reviewCount: 142,
    warrantyOffered: "25 Years Performance on Tier-1 Bifacial / Mono PERC Modules, 10 Years Inverter, 5 Years Free O&M",
    turnkeyRatePerWattInr: 54, // ₹54,000 / kW
    badge: "Coimbatore & Western TN Top Rated",
    contactEmail: "rooftop@kongusolar.demo",
    phone: "+91 94432 88100",
    headquarters: "Avinashi Road, Peelamedu, Coimbatore - 641004"
  },
  {
    id: "epc-tn-02",
    name: "Chennai SunPower Renewable EPC Solutions Pvt Ltd",
    tradeName: "SunPower Chennai",
    registeredCity: "Chennai",
    coveredDistricts: ["Chennai", "Kanchipuram", "Chengalpattu", "Thiruvallur", "Vellore"],
    experienceYears: 10,
    rooftopProjectsCompleted: 640,
    totalInstalledCapacityMw: 22.0,
    mnreEmpanelled: true,
    tangedcoVendorRegistered: true,
    specialization: ["Gated Communities & High-Rise RWAs", "Residential Societies", "Commercial Buildings"],
    rating: 4.8,
    reviewCount: 218,
    warrantyOffered: "25 Years DCR Module Warranty, 8 Years Micro-inverter / String Inverter, 5 Years Comprehensive O&M",
    turnkeyRatePerWattInr: 56, // ₹56,000 / kW
    badge: "Greater Chennai RWA Leader",
    contactEmail: "projects@sunpowerchennai.demo",
    phone: "+91 98401 22340",
    headquarters: "Anna Salai, Guindy, Chennai - 600032"
  },
  {
    id: "epc-tn-03",
    name: "Pandyan Solar Tech & Power Systems",
    tradeName: "Pandyan Solar",
    registeredCity: "Madurai",
    coveredDistricts: ["Madurai", "Dindigul", "Virudhunagar", "Sivaganga", "Theni"],
    experienceYears: 9,
    rooftopProjectsCompleted: 230,
    totalInstalledCapacityMw: 8.8,
    mnreEmpanelled: true,
    tangedcoVendorRegistered: true,
    specialization: ["Independent Villas", "Apartment Societies", "Institutional Rooftops"],
    rating: 4.9,
    reviewCount: 96,
    warrantyOffered: "25 Years Linear Power Warranty, 7 Years Inverter Warranty, Free Bi-Annual Cleaning for 3 Years",
    turnkeyRatePerWattInr: 52, // ₹52,000 / kW
    badge: "South Tamil Nadu Specialist",
    contactEmail: "epc@pandyansolar.demo",
    phone: "+91 94421 77650",
    headquarters: "KK Nagar, Madurai - 625020"
  },
  {
    id: "epc-tn-04",
    name: "Cauvery Clean Energy Engineering",
    tradeName: "Cauvery Solar",
    registeredCity: "Trichy",
    coveredDistricts: ["Trichy", "Thanjavur", "Karur", "Pudukkottai", "Perambalur"],
    experienceYears: 8,
    rooftopProjectsCompleted: 310,
    totalInstalledCapacityMw: 11.2,
    mnreEmpanelled: true,
    tangedcoVendorRegistered: true,
    specialization: ["Residential Rooftops", "Apartment Common Power", "Commercial LT Consumers"],
    rating: 4.7,
    reviewCount: 115,
    warrantyOffered: "25 Years Performance Guarantee, 5 Years Inverter, Net Metering Liaisoning Included",
    turnkeyRatePerWattInr: 53, // ₹53,000 / kW
    badge: "Central Delta Empanelled EPC",
    contactEmail: "contact@cauverysolar.demo",
    phone: "+91 98424 55900",
    headquarters: "Thillai Nagar, Tiruchirappalli - 620018"
  },
  {
    id: "epc-tn-05",
    name: "Chola Green Energy & Engineering Corp",
    tradeName: "Chola Solar Systems",
    registeredCity: "Salem",
    coveredDistricts: ["Salem", "Namakkal", "Dharmapuri", "Krishnagiri"],
    experienceYears: 11,
    rooftopProjectsCompleted: 280,
    totalInstalledCapacityMw: 9.6,
    mnreEmpanelled: true,
    tangedcoVendorRegistered: true,
    specialization: ["Apartment Complexes", "Industrial Sheds", "Individual Residences"],
    rating: 4.8,
    reviewCount: 88,
    warrantyOffered: "25 Years Module Warranty, 10 Years Inverter, 24/7 Remote Monitoring App",
    turnkeyRatePerWattInr: 55, // ₹55,000 / kW
    badge: "Salem & North-West Hub",
    contactEmail: "sales@cholasolar.demo",
    phone: "+91 98940 33110",
    headquarters: "Fairlands, Salem - 636016"
  }
];

// Active Promotional Campaigns in Tamil Nadu
export const TAMIL_NADU_ROOFTOP_CAMPAIGNS = [
  {
    id: "cmp-tn-apt-01",
    title: "Tamil Nadu Apartment Solar Community Aggregation Campaign",
    slug: "tamil-nadu-apartment-solar-community-drive",
    tagline: "Save 15% on Turnkey EPC + ₹18,000/kW PM Surya Ghar Subsidy for Common Areas",
    bannerHighlight: "Save 15% on Turnkey EPC + ₹18,000/kW PM Surya Ghar Subsidy for Common Areas",
    targetAudience: "Apartment Owners & Resident Welfare Associations (RWAs)",
    region: "All Tamil Nadu (Chennai, Coimbatore, Madurai, Trichy, Salem)",
    coverageArea: "Chennai, Coimbatore, Madurai, Trichy, Salem",
    discountOffer: "15% Group Discount",
    validTill: "31 Dec 2026",
    expiryDate: "2026-12-31",
    subsidyScheme: "PM Surya Ghar: ₹18,000/kW for RWAs up to 500 kW",
    ctaText: "Join RWA Campaign",
    description: "When 5 or more flat owners or your Apartment Association (RWA) signs up together, our Empanelled EPC partners offer bulk procurement discounts of ₹5,000/kW, plus free structural load assessments and priority TANGEDCO Net Metering liaisoning.",
    highlights: [
      "Bulk Pricing: 12% - 15% discount on Tier-1 turnkey solar installations.",
      "PM Surya Ghar Subsidy: Up to ₹18,000 per kW for common utility meters (lifts, water pumps, lighting) up to 500 kW.",
      "Free Society Energy Audit & Structural Load Testing worth ₹25,000.",
      "Green Apartment Certification & Corporate CSR / Community Recognition.",
      "₹10,000 Contribution to RWA Maintenance Corpus Fund upon commissioning."
    ],
    benefits: [
      "Bulk Pricing: 12% - 15% discount on Tier-1 turnkey solar installations.",
      "PM Surya Ghar Subsidy: Up to ₹18,000 per kW for common utility meters (lifts, water pumps, lighting) up to 500 kW.",
      "Free Society Energy Audit & Structural Load Testing worth ₹25,000.",
      "Green Apartment Certification & Corporate CSR / Community Recognition.",
      "₹10,000 Contribution to RWA Maintenance Corpus Fund upon commissioning."
    ],
    status: "ACTIVE",
    registeredSocietiesCount: 47,
    featuredBadge: "Flagship RWA Campaign"
  },
  {
    id: "cmp-tn-surya-02",
    title: "PM Surya Ghar: Muft Bijli Fast-Track Scheme for Individual Homes",
    slug: "pm-surya-ghar-fast-track-tamil-nadu",
    tagline: "Guaranteed Central Subsidy up to ₹78,000 Direct to Bank Account (DBT)",
    bannerHighlight: "Guaranteed Central Subsidy up to ₹78,000 Direct to Bank Account (DBT)",
    targetAudience: "Individual Homeowners & Villa Residents",
    region: "Tamil Nadu State-wide (TANGEDCO Domestic Tariff 1A)",
    coverageArea: "All Districts in Tamil Nadu",
    discountOffer: "Up to ₹78,000 Direct Subsidy",
    validTill: "30 Nov 2026",
    expiryDate: "2026-11-30",
    subsidyScheme: "PM Surya Ghar: Muft Bijli Yojana",
    ctaText: "Apply Fast-Track Subsidy",
    description: "Full end-to-end liaisoning through our empanelled vendors for national portal registration, TANGEDCO bi-directional net meter sanction, CEIG inspection, and 7% Jan Samarth collateral-free green loans.",
    highlights: [
      "1 kW Rooftop: ₹30,000 Direct Central Subsidy (Net cost ~₹25,000)",
      "2 kW Rooftop: ₹60,000 Direct Central Subsidy (Net cost ~₹50,000)",
      "3 kW+ Rooftop: ₹78,000 Maximum Direct Central Subsidy (Net cost ~₹87,000)",
      "Zero Electricity Bills: Generate ~360 - 450 units/month, slashing TANGEDCO bills to near ₹0.",
      "Payback in under 3.5 years, followed by 20+ years of free green power."
    ],
    benefits: [
      "1 kW Rooftop: ₹30,000 Direct Central Subsidy (Net cost ~₹25,000)",
      "2 kW Rooftop: ₹60,000 Direct Central Subsidy (Net cost ~₹50,000)",
      "3 kW+ Rooftop: ₹78,000 Maximum Direct Central Subsidy (Net cost ~₹87,000)",
      "Zero Electricity Bills: Generate ~360 - 450 units/month, slashing TANGEDCO bills to near ₹0.",
      "Payback in under 3.5 years, followed by 20+ years of free green power."
    ],
    status: "ACTIVE",
    registeredSocietiesCount: 184,
    featuredBadge: "High Subsidy Drive"
  },
  {
    id: "cmp-tn-resco-03",
    title: "Zero-Capex RESCO Solar for Large Gated Societies (50 kW - 250 kW)",
    slug: "zero-capex-resco-apartment-tamil-nadu",
    tagline: "Zero Upfront Investment. Buy Solar Energy at ₹4.90/unit instead of TANGEDCO ₹8.15/unit",
    bannerHighlight: "Zero Upfront Investment. Buy Solar Energy at ₹4.90/unit instead of TANGEDCO ₹8.15/unit",
    targetAudience: "Large Residential Societies (100+ Flats) & Commercial Campuses",
    region: "Chennai & Coimbatore Urban Centers",
    coverageArea: "Chennai & Coimbatore",
    discountOffer: "₹0 Upfront Investment",
    validTill: "31 Dec 2026",
    expiryDate: "2026-12-31",
    subsidyScheme: "RESCO Developer PPA at ₹4.90/unit",
    ctaText: "Explore Zero-Capex RESCO",
    description: "Our certified RESCO developers install, own, and maintain the solar plant on your terrace for 20 years. The society only pays for the actual solar units consumed at a discounted tariff, delivering immediate monthly savings from Day 1 without touching the association's reserve funds.",
    highlights: [
      "₹0 Capital Investment required from the society or flat owners.",
      "Guaranteed ~40% discount on TANGEDCO Tariff 1D common service rate.",
      "Comprehensive 20-year maintenance, cleaning, and equipment insurance managed by the developer.",
      "Option to acquire the asset at nominal salvage cost at Year 15 or Year 20."
    ],
    benefits: [
      "₹0 Capital Investment required from the society or flat owners.",
      "Guaranteed ~40% discount on TANGEDCO Tariff 1D common service rate.",
      "Comprehensive 20-year maintenance, cleaning, and equipment insurance managed by the developer.",
      "Option to acquire the asset at nominal salvage cost at Year 15 or Year 20."
    ],
    status: "ACTIVE",
    registeredSocietiesCount: 19,
    featuredBadge: "Zero Upfront Cost"
  }
];

// Persistent state stores (in memory with initial demo proposals)
const inMemoryProposals: RooftopProposalRecord[] = [
  {
    id: "prop-tn-demo-01",
    proposalCode: "EB-ROOF-TN-2026-001",
    applicantType: "APARTMENT_RWA",
    fullName: "V. Ramaswamy (President, RWA)",
    phone: "+91 98400 12345",
    email: "rwa@vandalurparkview.demo",
    city: "Chennai",
    district: "Chengalpattu",
    state: "Tamil Nadu",
    apartmentName: "Vandalur Park View Residency (180 Flats)",
    numberOfFlats: 180,
    ebConsumerNumber: "09-241-004-182",
    monthlyBillInr: 145000,
    sanctionedLoadKw: 65,
    availableRoofAreaSqFt: 6500,
    roofType: "RCC_FLAT",
    recommendedCapacityKw: 50,
    estimatedTurnkeyCostInr: 2750000,
    applicableSubsidyInr: 900000, // ₹18k/kW * 50 kW
    netPayableInr: 1850000,
    annualSavingsInr: 580000,
    preferredModel: "CAPEX",
    targetEpcVendorIds: ["epc-tn-02", "epc-tn-01"],
    status: "FORWARDED_TO_EPCS",
    notes: "High interest in powering 4 passenger lifts and 2 borewell pumps via common terrace solar. Seeking bids from empanelled EPCs.",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: "prop-tn-demo-02",
    proposalCode: "EB-ROOF-TN-2026-002",
    applicantType: "INDIVIDUAL",
    fullName: "S. Muruganandam",
    phone: "+91 94431 87654",
    email: "muruganandam.s@demo.in",
    city: "Coimbatore",
    district: "Coimbatore",
    state: "Tamil Nadu",
    ebConsumerNumber: "03-112-008-941",
    monthlyBillInr: 5200,
    sanctionedLoadKw: 5,
    availableRoofAreaSqFt: 450,
    roofType: "RCC_FLAT",
    recommendedCapacityKw: 3.5,
    estimatedTurnkeyCostInr: 195000,
    applicableSubsidyInr: 78000,
    netPayableInr: 117000,
    annualSavingsInr: 46000,
    preferredModel: "CAPEX",
    targetEpcVendorIds: ["epc-tn-01", "epc-tn-05"],
    status: "SITE_SURVEY_SCHEDULED",
    notes: "Independent villa in RS Puram. Looking to claim PM Surya Ghar subsidy before next billing cycle.",
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString()
  }
];

const inMemoryCampaignSignups: CampaignSignupRecord[] = [
  {
    id: "cmp-sign-01",
    campaignId: "cmp-tn-apt-01",
    societyName: "Royal Palms Apartment Owners Association",
    associationRegNumber: "TN-SLM-RWA-2018-04",
    secretaryName: "K. Senthil Kumar",
    contactPhone: "+91 97890 44321",
    contactEmail: "secretary@royalpalms.demo",
    city: "Salem",
    numberOfUnits: 64,
    estimatedCommonAreaLoadKw: 25,
    preferredDateForOrientation: "2026-10-25",
    status: "ORIENTATION_SCHEDULED",
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
  }
];

// Helper: Calculate Tamil Nadu Rooftop Solar Economics
export function calculateTamilNaduRooftopEconomics(params: {
  applicantType: "INDIVIDUAL" | "APARTMENT_OWNER" | "APARTMENT_RWA" | "COMMERCIAL";
  monthlyBillInr: number;
  availableRoofAreaSqFt?: number;
  desiredCapacityKw?: number;
}) {
  // 1 kW requires ~90 - 100 sq.ft of shadow-free area
  // 1 kW generates ~4.2 - 4.4 kWh/day in Tamil Nadu = ~125 - 130 kWh/month
  // Average TANGEDCO residential tariff is slab-based: ₹4.50 - ₹9.00/unit (blended ~₹7.20/unit)
  // TANGEDCO Common Services (Tariff 1D) is ~₹8.15/unit
  // Turnkey benchmark cost: ₹55,000 / kW turnkey (DCR bifacial/mono, inverter, structure, net meter)

  let capacityKw = 0;

  if (params.desiredCapacityKw && params.desiredCapacityKw > 0) {
    capacityKw = params.desiredCapacityKw;
  } else if (params.availableRoofAreaSqFt && params.availableRoofAreaSqFt > 0) {
    const maxCapacityFromRoof = Math.floor(params.availableRoofAreaSqFt / 95);
    // Capacity from bill sizing:
    const tariffRate = params.applicantType === "APARTMENT_RWA" ? 8.15 : 7.20;
    const estimatedMonthlyUnits = params.monthlyBillInr / tariffRate;
    const capacityFromConsumption = Math.ceil(estimatedMonthlyUnits / 125);
    capacityKw = Math.min(maxCapacityFromRoof, Math.max(1, capacityFromConsumption));
  } else {
    const tariffRate = params.applicantType === "APARTMENT_RWA" ? 8.15 : 7.20;
    const estimatedMonthlyUnits = params.monthlyBillInr / tariffRate;
    capacityKw = Math.max(1, Math.ceil(estimatedMonthlyUnits / 125));
  }

  // Cap minimum and sane bounds
  capacityKw = Math.max(1, Math.min(500, capacityKw));

  // Benchmark turnkey cost
  const baseCostPerKw = params.applicantType === "APARTMENT_RWA" && capacityKw >= 25 ? 52000 : 56000;
  const grossTurnkeyCost = capacityKw * baseCostPerKw;

  // PM Surya Ghar Subsidy formula (MNRE Rules 2026):
  // Individual Residential (Up to 3 kW):
  // 1 kW: ₹30,000
  // 2 kW: ₹60,000
  // 3 kW+: ₹78,000 flat
  // Apartment Association (RWA) common facilities (EV charging, lighting, water pumps):
  // ₹18,000 / kW up to 500 kW capacity limit
  let centralSubsidyInr = 0;
  if (params.applicantType === "INDIVIDUAL" || params.applicantType === "APARTMENT_OWNER") {
    if (capacityKw < 2) {
      centralSubsidyInr = 30000;
    } else if (capacityKw < 3) {
      centralSubsidyInr = 60000;
    } else {
      centralSubsidyInr = 78000;
    }
  } else if (params.applicantType === "APARTMENT_RWA") {
    centralSubsidyInr = Math.min(capacityKw * 18000, 9000000); // Up to 500 kW * 18,000
  } else {
    // Commercial / MSME: Accelerated depreciation (40%) and concessional credit, no direct DBT
    centralSubsidyInr = 0;
  }

  const netPayableInr = Math.max(0, grossTurnkeyCost - centralSubsidyInr);

  // Annual Generation & Savings
  const monthlyGenUnits = Math.round(capacityKw * 125);
  const annualGenUnits = monthlyGenUnits * 12;
  const effectiveTariff = params.applicantType === "APARTMENT_RWA" ? 8.15 : 7.20;
  const annualSavingsInr = Math.round(annualGenUnits * effectiveTariff);
  const monthlySavingsInr = Math.round(annualSavingsInr / 12);

  // Payback period
  const paybackYears = annualSavingsInr > 0 ? Number((netPayableInr / annualSavingsInr).toFixed(1)) : 4.0;
  // 25-Year Cumulative Savings (allowing for 0.7% annual module degradation and 3% power tariff escalation)
  const lifetime25YrSavingsInr = Math.round(annualSavingsInr * 22.5);

  // CO2 reduction: 0.82 kg CO2 per kWh in Indian grid
  const annualCo2MitigationTonnes = Number(((annualGenUnits * 0.82) / 1000).toFixed(1));

  return {
    capacityKw,
    monthlyGenUnits,
    annualGenUnits,
    grossTurnkeyCost,
    centralSubsidyInr,
    netPayableInr,
    monthlySavingsInr,
    annualSavingsInr,
    paybackYears,
    lifetime25YrSavingsInr,
    annualCo2MitigationTonnes,
    subsidyProgram: params.applicantType === "APARTMENT_RWA" 
      ? "PM Surya Ghar: RWA Common Area Facility (₹18,000 / kW up to 500 kW)" 
      : params.applicantType === "COMMERCIAL"
      ? "Section 32 Accelerated Depreciation (40%) + Priority Sector Credit"
      : "PM Surya Ghar: Muft Bijli Yojana (Up to ₹78,000 Direct DBT)"
  };
}

// -------------------------------------------------------------
// ROUTES
// -------------------------------------------------------------

// 1. Calculate instant feasibility and savings
router.post("/estimate", (req: Request, res: Response): void => {
  try {
    const { applicantType, monthlyBillInr, availableRoofAreaSqFt, desiredCapacityKw } = req.body;

    if (!applicantType || !monthlyBillInr || monthlyBillInr <= 0) {
      res.status(400).json({ success: false, error: { code: "INVALID_INPUT", message: "Applicant type and monthly bill are required" } });
      return;
    }

    const calculation = calculateTamilNaduRooftopEconomics({
      applicantType,
      monthlyBillInr: parseFloat(monthlyBillInr),
      availableRoofAreaSqFt: availableRoofAreaSqFt ? parseFloat(availableRoofAreaSqFt) : undefined,
      desiredCapacityKw: desiredCapacityKw ? parseFloat(desiredCapacityKw) : undefined
    });

    res.json({
      success: true,
      data: calculation
    });
  } catch (err: any) {
    console.error("Rooftop estimate error:", err);
    res.status(500).json({ success: false, error: { code: "CALCULATION_ERROR", message: err.message || "Failed to calculate rooftop feasibility" } });
  }
});

// 2. Get verified Tamil Nadu EPC Vendors
router.get("/vendors", (req: Request, res: Response): void => {
  try {
    const { district, search } = req.query;

    let filtered = [...TAMIL_NADU_ROOFTOP_EPCS];

    if (district) {
      const distStr = (district as string).toLowerCase().trim();
      filtered = filtered.filter(v => 
        v.registeredCity.toLowerCase().includes(distStr) ||
        v.coveredDistricts.some(d => d.toLowerCase().includes(distStr))
      );
    }

    if (search) {
      const q = (search as string).toLowerCase().trim();
      filtered = filtered.filter(v =>
        v.name.toLowerCase().includes(q) ||
        v.tradeName.toLowerCase().includes(q) ||
        v.registeredCity.toLowerCase().includes(q) ||
        v.specialization.some(s => s.toLowerCase().includes(q))
      );
    }

    res.json({
      success: true,
      data: filtered
    });
  } catch (err: any) {
    console.error("Fetch rooftop vendors error:", err);
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch vendors" } });
  }
});

// 3. Get active promotional campaigns
router.get("/campaigns", (_req: Request, res: Response): void => {
  res.json({
    success: true,
    data: TAMIL_NADU_ROOFTOP_CAMPAIGNS
  });
});

// 4. Submit a Rooftop Solar Proposal / Lead
router.post("/proposals", (req: Request, res: Response): void => {
  try {
    const {
      applicantType,
      fullName,
      phone,
      email,
      city,
      district,
      apartmentName,
      numberOfFlats,
      ebConsumerNumber,
      monthlyBillInr,
      availableRoofAreaSqFt,
      roofType,
      desiredCapacityKw,
      preferredModel = "CAPEX",
      targetEpcVendorIds = [],
      notes
    } = req.body;

    if (!fullName || !phone || !city || !monthlyBillInr) {
      res.status(400).json({
        success: false,
        error: { code: "MISSING_REQUIRED_FIELDS", message: "Full name, phone, city, and monthly bill are required" }
      });
      return;
    }

    const economics = calculateTamilNaduRooftopEconomics({
      applicantType: applicantType || "INDIVIDUAL",
      monthlyBillInr: parseFloat(monthlyBillInr),
      availableRoofAreaSqFt: availableRoofAreaSqFt ? parseFloat(availableRoofAreaSqFt) : undefined,
      desiredCapacityKw: desiredCapacityKw ? parseFloat(desiredCapacityKw) : undefined
    });

    const proposalCode = `EB-ROOF-TN-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    // Automatically match top 2 local EPC vendors if none selected
    let selectedVendors = targetEpcVendorIds;
    if (!selectedVendors || selectedVendors.length === 0) {
      const localMatches = TAMIL_NADU_ROOFTOP_EPCS.filter(v => 
        v.registeredCity.toLowerCase() === city.toLowerCase() || 
        v.coveredDistricts.some(d => d.toLowerCase() === (district || city).toLowerCase())
      );
      selectedVendors = localMatches.length > 0 
        ? localMatches.slice(0, 3).map(v => v.id)
        : TAMIL_NADU_ROOFTOP_EPCS.slice(0, 2).map(v => v.id);
    }

    const newRecord: RooftopProposalRecord = {
      id: `prop-${Date.now()}`,
      proposalCode,
      applicantType: applicantType || "INDIVIDUAL",
      fullName,
      phone,
      email: email || `${phone.replace(/\D/g, '')}@lead.electricitybazaar.in`,
      city,
      district: district || city,
      state: "Tamil Nadu",
      apartmentName,
      numberOfFlats: numberOfFlats ? parseInt(numberOfFlats) : undefined,
      ebConsumerNumber,
      monthlyBillInr: parseFloat(monthlyBillInr),
      availableRoofAreaSqFt: availableRoofAreaSqFt ? parseFloat(availableRoofAreaSqFt) : 0,
      roofType: roofType || "RCC_FLAT",
      recommendedCapacityKw: economics.capacityKw,
      estimatedTurnkeyCostInr: economics.grossTurnkeyCost,
      applicableSubsidyInr: economics.centralSubsidyInr,
      netPayableInr: economics.netPayableInr,
      annualSavingsInr: economics.annualSavingsInr,
      preferredModel,
      targetEpcVendorIds: selectedVendors,
      status: "FORWARDED_TO_EPCS",
      notes,
      createdAt: new Date().toISOString()
    };

    inMemoryProposals.unshift(newRecord);

    const vendorDetails = TAMIL_NADU_ROOFTOP_EPCS.filter(v => selectedVendors.includes(v.id));

    res.json({
      success: true,
      message: `Rooftop proposal successfully created and forwarded to ${vendorDetails.length} empanelled EPC vendors in ${city}, Tamil Nadu.`,
      data: {
        proposal: newRecord,
        economics,
        forwardedVendors: vendorDetails
      }
    });
  } catch (err: any) {
    console.error("Create rooftop proposal error:", err);
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: err.message || "Failed to create proposal" } });
  }
});

// 5. Get submitted proposals
router.get("/proposals", (req: Request, res: Response): void => {
  try {
    const { city, applicantType, phone } = req.query;

    let records = [...inMemoryProposals];

    if (city) {
      records = records.filter(p => p.city.toLowerCase() === (city as string).toLowerCase());
    }
    if (applicantType) {
      records = records.filter(p => p.applicantType === applicantType);
    }
    if (phone) {
      records = records.filter(p => p.phone.includes(phone as string));
    }

    res.json({
      success: true,
      data: records
    });
  } catch (err: any) {
    console.error("Fetch proposals error:", err);
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch proposals" } });
  }
});

// 6. Register Apartment Association for Community Campaign
router.post("/campaign-signup", (req: Request, res: Response): void => {
  try {
    const {
      campaignId,
      societyName,
      associationRegNumber,
      secretaryName,
      contactPhone,
      contactEmail,
      city,
      numberOfUnits,
      estimatedCommonAreaLoadKw,
      preferredDateForOrientation
    } = req.body;

    if (!societyName || !secretaryName || !contactPhone || !city) {
      res.status(400).json({
        success: false,
        error: { code: "MISSING_FIELDS", message: "Society name, secretary name, phone, and city are required" }
      });
      return;
    }

    const registration: CampaignSignupRecord = {
      id: `sign-${Date.now()}`,
      campaignId: campaignId || "cmp-tn-apt-01",
      societyName,
      associationRegNumber,
      secretaryName,
      contactPhone,
      contactEmail,
      city,
      numberOfUnits: numberOfUnits ? parseInt(numberOfUnits) : 50,
      estimatedCommonAreaLoadKw: estimatedCommonAreaLoadKw ? parseFloat(estimatedCommonAreaLoadKw) : 20,
      preferredDateForOrientation: preferredDateForOrientation || new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
      status: "ORIENTATION_SCHEDULED",
      createdAt: new Date().toISOString()
    };

    inMemoryCampaignSignups.unshift(registration);

    res.json({
      success: true,
      message: `Apartment Association "${societyName}" registered for the Tamil Nadu Community Solar Campaign. Our nodal EPC officer will contact you within 24 hours.`,
      data: registration
    });
  } catch (err: any) {
    console.error("Campaign signup error:", err);
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to register campaign" } });
  }
});

export default router;
