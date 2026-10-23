import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Electricity Bazaar database with realistic DEMO DATA...");

  // Clean existing tables in reverse dependency order
  await prisma.auditLog.deleteMany();
  await prisma.savedCalculation.deleteMany();
  await prisma.savedListing.deleteMany();
  await prisma.enquiryMessage.deleteMany();
  await prisma.enquiry.deleteMany();
  await prisma.verificationRecord.deleteMany();
  await prisma.listingDocument.deleteMany();
  await prisma.document.deleteMany();
  await prisma.tenderOpportunity.deleteMany();
  await prisma.serviceListing.deleteMany();
  await prisma.renewableAssetDetail.deleteMany();
  await prisma.storageAssetDetail.deleteMany();
  await prisma.marketplaceListing.deleteMany();
  await prisma.buyerRequirement.deleteMany();
  await prisma.organisationMembership.deleteMany();
  await prisma.organisation.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("Demo@123456", 10);

  // 1. Create System Admin
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@electricitybazaar.in",
      passwordHash,
      fullName: "Vikram Sengupta (Platform Admin)",
      phone: "+91 98110 00001",
      isEmailVerified: true
    }
  });

  const adminOrg = await prisma.organisation.create({
    data: {
      legalName: "Electricity Bazaar Operations Pvt Ltd",
      tradeName: "Electricity Bazaar",
      orgType: "PLATFORM_ADMIN",
      verificationStatus: "VERIFIED_FOR_STATED_SCOPE",
      registeredState: "Telangana",
      isDemoData: true
    }
  });

  await prisma.organisationMembership.create({
    data: {
      userId: adminUser.id,
      organisationId: adminOrg.id,
      role: "PLATFORM_ADMIN"
    }
  });

  // 2. Industrial Buyer in Telangana (Hyderabad Pharma)
  const buyerUserTG = await prisma.user.create({
    data: {
      email: "procurement@hydpharma.demo",
      passwordHash,
      fullName: "Rajesh Reddy (Chief Energy Manager)",
      phone: "+91 98480 12345",
      isEmailVerified: true
    }
  });

  const buyerOrgTG = await prisma.organisation.create({
    data: {
      legalName: "DEMO: Hyderabad Bulk Drugs & Pharma Specialities Ltd",
      tradeName: "Hyderabad Pharma",
      registrationNumber: "U24239TG2015PLC099887",
      orgType: "BUYER_CI",
      verificationStatus: "VERIFIED_FOR_STATED_SCOPE",
      verificationNotes: "HT Consumer No: HT-TSSPDCL-00892 verified at 33 kV substation.",
      verifiedAt: new Date(),
      registeredState: "Telangana",
      headquartersAddress: "Jeedimetla Industrial Estate, Hyderabad, Telangana",
      isDemoData: true
    }
  });

  await prisma.organisationMembership.create({
    data: {
      userId: buyerUserTG.id,
      organisationId: buyerOrgTG.id,
      role: "BUYER_ADMIN"
    }
  });

  // Buyer Requirement in Telangana
  const buyerReqTG = await prisma.buyerRequirement.create({
    data: {
      requirementCode: "REQ-2026-TG-001",
      organisationId: buyerOrgTG.id,
      title: "5 MW Solar / Hybrid Renewable Power for Pharma Formulation Facility",
      industryType: "Pharmaceuticals & Bulk Chemicals",
      state: "Telangana",
      discomName: "TSSPDCL (Southern Power)",
      numberOfFacilities: 2,
      contractDemandKva: 6000,
      sanctionedLoadKw: 5000,
      monthlyConsumptionKwh: 1250000, // 1.25 MU/month
      currentSupplyCostPerKwh: 8.85,
      targetRenewablePercent: 80.0,
      preferredTechnology: "Solar Mono-PERC / RTC Hybrid",
      commercialModel: "GROUP_CAPTIVE",
      requiredStartDate: new Date("2026-11-01"),
      contractTenureYears: 15,
      openAccessPreference: "Group Captive (26% Equity / 51% Consumption)",
      additionalNotes: "DEMO DATA — NOT A REAL OFFER. Seeking Group Captive partnership to eliminate Cross-Subsidy Surcharge (CSS) and Additional Surcharge under TSERC norms.",
      status: "ACTIVE",
      isConsentGivenToShare: true
    }
  });

  // 2b. Industrial Buyer in Tamil Nadu (Coimbatore Precision Auto Components - First Customer Focus)
  const buyerUserTN = await prisma.user.create({
    data: {
      email: "procurement@coimbatoreauto.demo",
      passwordHash,
      fullName: "Senthil Murugan (VP - Operations & Energy)",
      phone: "+91 94430 55443",
      isEmailVerified: true
    }
  });

  const buyerOrgTN = await prisma.organisation.create({
    data: {
      legalName: "DEMO: Coimbatore Precision Auto Components & Foundry Ltd",
      tradeName: "Coimbatore Precision Auto",
      registrationNumber: "U29299TZ2012PLC018765",
      orgType: "BUYER_CI",
      verificationStatus: "VERIFIED_FOR_STATED_SCOPE",
      verificationNotes: "HT Consumer No: HT-TANGEDCO-CBE-0412 at 22 kV substation verified. Qualified HT-I consumer.",
      verifiedAt: new Date(),
      registeredState: "Tamil Nadu",
      headquartersAddress: "Kurichi Industrial Cluster, Coimbatore, Tamil Nadu",
      isDemoData: true
    }
  });

  await prisma.organisationMembership.create({
    data: {
      userId: buyerUserTN.id,
      organisationId: buyerOrgTN.id,
      role: "BUYER_ADMIN"
    }
  });

  // Buyer Requirement in Tamil Nadu
  const buyerReqTN = await prisma.buyerRequirement.create({
    data: {
      requirementCode: "REQ-2026-TN-002",
      organisationId: buyerOrgTN.id,
      title: "3.5 MW Solar / Wind Green Power for Precision Foundry & Machining Unit",
      industryType: "Automotive Components & Precision Machining",
      state: "Tamil Nadu",
      discomName: "TANGEDCO (Tamil Nadu Generation & Distribution Corp)",
      numberOfFacilities: 1,
      contractDemandKva: 4200,
      sanctionedLoadKw: 3500,
      monthlyConsumptionKwh: 850000, // 0.85 MU/month
      currentSupplyCostPerKwh: 8.75, // HT-I landed rate
      targetRenewablePercent: 85.0,
      preferredTechnology: "Solar Mono-PERC / Wind Hybrid",
      commercialModel: "GROUP_CAPTIVE",
      requiredStartDate: new Date("2026-11-15"),
      contractTenureYears: 15,
      openAccessPreference: "Group Captive (26% Equity / 51% Consumption)",
      additionalNotes: "DEMO DATA — NOT A REAL OFFER. Priority pilot customer in Tamil Nadu. Seeking captive partnership to bypass TNERC CSS (₹2.12/kWh) and achieve < ₹5.20 landed cost.",
      status: "ACTIVE",
      isConsentGivenToShare: true
    }
  });

  // 3. RE Developer in Telangana (Deccan Green Energy)
  const sellerUserTG = await prisma.user.create({
    data: {
      email: "bd@deccangreen.demo",
      passwordHash,
      fullName: "Anand Rao (Director - Business Development)",
      phone: "+91 97010 54321",
      isEmailVerified: true
    }
  });

  const sellerOrgTG = await prisma.organisation.create({
    data: {
      legalName: "DEMO: Deccan Green Energy Developers Private Limited",
      tradeName: "Deccan Green Power",
      registrationNumber: "U40106TG2018PTC128456",
      orgType: "RE_DEVELOPER",
      verificationStatus: "VERIFIED_FOR_STATED_SCOPE",
      verificationNotes: "Land title deed (55 acres) & TSTRANSCO 33 kV grid connectivity approval verified.",
      verifiedAt: new Date(),
      registeredState: "Telangana",
      headquartersAddress: "Banjara Hills, Hyderabad, Telangana",
      isDemoData: true
    }
  });

  await prisma.organisationMembership.create({
    data: {
      userId: sellerUserTG.id,
      organisationId: sellerOrgTG.id,
      role: "SELLER_ADMIN"
    }
  });

  // Listing 1: 10 MW Solar in Telangana (5 MW Available)
  const listingSolarTG = await prisma.marketplaceListing.create({
    data: {
      listingCode: "LST-2026-TG-SOL-01",
      organisationId: sellerOrgTG.id,
      title: "DEMO: 10 MW Solar Ground-Mounted Power Plant (5 MW Available) - Mahbubnagar",
      slug: "demo-10-mw-solar-mahbubnagar-telangana",
      category: "SOLAR_POWER",
      commercialModel: "GROUP_CAPTIVE",
      state: "Telangana",
      projectLocation: "Mahbubnagar District, Telangana (Connected to 33 kV Jadcherla Substation)",
      totalCapacityMw: 10.0,
      availableCapacityMw: 5.0,
      indicativePricePerKwh: 3.65,
      priceBasisConditions: "Ex-busbar at 33 kV interconnection. Fixed for 10 years, 1.5% annual escalation thereafter. 0 CSS under Group Captive.",
      contractDurationYears: 15,
      expectedAvailabilityDate: new Date("2026-10-15"),
      interconnectionType: "STU_INTRA_STATE",
      substationDetails: "33/11 kV TSTRANSCO Substation, Jadcherla, feeder capacity sanctioned.",
      projectStatus: "OPERATIONAL",
      regulatoryApprovals: "TSTRANSCO in-principle connectivity & CEIG statutory electrical safety approvals documented.",
      isFeatured: true,
      status: "PUBLISHED",
      isDemoData: true,
      viewCount: 142,
      renewableDetails: {
        create: {
          technology: "Solar Mono-PERC Bifacial 545 Wp modules with single-axis tracking",
          dcAcRatio: 1.35,
          cuFactorPercent: 25.2,
          expectedAnnualGenMu: 22.0,
          captiveStructureInfo: "Structured SPV compliant with Electricity Rules 2005 (26% equity holding and 51% proportional consumption).",
          bankingTerms: "1-month banking permitted as per prevailing TSERC Green Open Access regulation."
        }
      }
    }
  });

  // Listing 2: 25 MW Wind Power in Gujarat
  const sellerUserGJ = await prisma.user.create({
    data: {
      email: "projects@kutchwind.demo",
      passwordHash,
      fullName: "Parth Patel (Head of Power Marketing)",
      phone: "+91 98250 88776",
      isEmailVerified: true
    }
  });

  const sellerOrgGJ = await prisma.organisation.create({
    data: {
      legalName: "DEMO: Kutch Wind & Clean Energy Ventures LLP",
      tradeName: "Kutch Wind",
      orgType: "RE_DEVELOPER",
      verificationStatus: "VERIFIED_FOR_STATED_SCOPE",
      verificationNotes: "GETCO 66 kV evacuation approval on file.",
      registeredState: "Gujarat",
      isDemoData: true
    }
  });

  await prisma.organisationMembership.create({
    data: {
      userId: sellerUserGJ.id,
      organisationId: sellerOrgGJ.id,
      role: "SELLER_ADMIN"
    }
  });

  const listingWindGJ = await prisma.marketplaceListing.create({
    data: {
      listingCode: "LST-2026-GJ-WND-02",
      organisationId: sellerOrgGJ.id,
      title: "DEMO: 25 MW Wind Energy Project (12 MW Available) - Bhuj, Kutch",
      slug: "demo-25-mw-wind-bhuj-kutch-gujarat",
      category: "WIND_POWER",
      commercialModel: "THIRD_PARTY_OPEN_ACCESS",
      state: "Gujarat",
      projectLocation: "Bhuj, Kutch District, Gujarat",
      totalCapacityMw: 25.0,
      availableCapacityMw: 12.0,
      indicativePricePerKwh: 3.45,
      priceBasisConditions: "Ex-busbar GETCO grid at 66 kV. 25-year tenure. Applicable GERC wheeling and CSS payable by drawal entity.",
      contractDurationYears: 25,
      expectedAvailabilityDate: new Date("2026-12-01"),
      interconnectionType: "STU_INTRA_STATE",
      projectStatus: "OPERATIONAL",
      regulatoryApprovals: "GETCO evacuation line commissioned, GEDA micro-siting approved.",
      isFeatured: true,
      status: "PUBLISHED",
      isDemoData: true,
      viewCount: 98,
      renewableDetails: {
        create: {
          technology: "2.7 MW Suzlon Wind Turbine Generators with 140m hub height",
          cuFactorPercent: 34.8,
          expectedAnnualGenMu: 76.2,
          bankingTerms: "GERC annual banking provisions apply."
        }
      }
    }
  });

  // Listing 3: 50 MW Hybrid RTC Firm Renewable Power - Rajasthan (CTU Inter-State)
  const listingRtcRJ = await prisma.marketplaceListing.create({
    data: {
      listingCode: "LST-2026-RJ-RTC-03",
      organisationId: sellerOrgTG.id,
      title: "DEMO: 50 MW Wind-Solar Hybrid Round-The-Clock (RTC) Firm Power - Bikaner",
      slug: "demo-50-mw-hybrid-rtc-firm-power-bikaner",
      category: "RTC_FIRM_POWER",
      commercialModel: "THIRD_PARTY_OPEN_ACCESS",
      state: "Rajasthan",
      projectLocation: "Bikaner Solar & Wind Corridor, Rajasthan",
      totalCapacityMw: 50.0,
      availableCapacityMw: 20.0,
      indicativePricePerKwh: 4.15,
      priceBasisConditions: "Ex-busbar at 400 kV CTU Grid Substation. Firm 80% annual availability profile with BESS buffering.",
      contractDurationYears: 20,
      expectedAvailabilityDate: new Date("2027-03-31"),
      interconnectionType: "CTU_INTER_STATE",
      projectStatus: "READY_TO_BUILD",
      regulatoryApprovals: "PGCIL Stage-II connectivity granted; LTA in-principle approved.",
      isFeatured: true,
      status: "PUBLISHED",
      isDemoData: true,
      viewCount: 215,
      renewableDetails: {
        create: {
          technology: "Hybrid Solar (35 MW) + Wind (25 MW) + 10 MW/20 MWh Li-ion Battery Buffering",
          cuFactorPercent: 48.5,
          expectedAnnualGenMu: 212.0
        }
      }
    }
  });

  // Listing 3b: 15 MW Solar & Wind Hybrid in Tamil Nadu (Co-Flagship Pilot Listing)
  const sellerUserTN = await prisma.user.create({
    data: {
      email: "power@kongurenewables.demo",
      passwordHash,
      fullName: "Karthik Natarajan (Managing Partner)",
      phone: "+91 98422 11990",
      isEmailVerified: true
    }
  });

  const sellerOrgTN = await prisma.organisation.create({
    data: {
      legalName: "DEMO: Kongu Green Energy & Wind Developers LLP",
      tradeName: "Kongu Renewables",
      registrationNumber: "AAB-4491-TN",
      orgType: "RE_DEVELOPER",
      verificationStatus: "VERIFIED_FOR_STATED_SCOPE",
      verificationNotes: "TANTRANSCO 33/110 kV Kayathar Substation grid connectivity approval verified. Statutory CEIG inspection passed.",
      verifiedAt: new Date(),
      registeredState: "Tamil Nadu",
      headquartersAddress: "Avinashi Road, Coimbatore, Tamil Nadu",
      isDemoData: true
    }
  });

  await prisma.organisationMembership.create({
    data: {
      userId: sellerUserTN.id,
      organisationId: sellerOrgTN.id,
      role: "SELLER_ADMIN"
    }
  });

  const listingHybridTN = await prisma.marketplaceListing.create({
    data: {
      listingCode: "LST-2026-TN-HYB-06",
      organisationId: sellerOrgTN.id,
      title: "DEMO: 15 MW Wind-Solar Hybrid Power Project (6 MW Available) - Kayathar, Tirunelveli",
      slug: "demo-15-mw-wind-solar-hybrid-tirunelveli-tamil-nadu",
      category: "HYBRID_RENEWABLE",
      commercialModel: "GROUP_CAPTIVE",
      state: "Tamil Nadu",
      projectLocation: "Kayathar / Radhapuram Wind-Solar Corridor, Tirunelveli District, Tamil Nadu",
      totalCapacityMw: 15.0,
      availableCapacityMw: 6.0,
      indicativePricePerKwh: 3.70,
      priceBasisConditions: "Ex-busbar at TANTRANSCO 33 kV feeder. 15-year PPA tenure. Group Captive SPV with 26% equity subscription. 0 CSS and 0 Additional Surcharge.",
      contractDurationYears: 15,
      expectedAvailabilityDate: new Date("2026-10-25"),
      interconnectionType: "STU_INTRA_STATE",
      substationDetails: "Connected to 110/33 kV TANTRANSCO Substation, Kayathar.",
      projectStatus: "OPERATIONAL",
      regulatoryApprovals: "TANGEDCO/TANTRANSCO grid parallel operation sanction and CEIG certification on record.",
      isFeatured: true,
      status: "PUBLISHED",
      isDemoData: true,
      viewCount: 184,
      renewableDetails: {
        create: {
          technology: "Hybrid: 9 MW Solar TopCon Bifacial + 6 MW Wind Gamesa G97 2.0 MW WTGs",
          dcAcRatio: 1.32,
          cuFactorPercent: 36.4,
          expectedAnnualGenMu: 47.8,
          captiveStructureInfo: "Group Captive SPV compliant with TNERC & Electricity Rules 2005 (Rule 3).",
          bankingTerms: "Energy banking managed as per TNERC Green Open Access and wind banking orders."
        }
      }
    }
  });

  // Listing 4: 20 MW / 80 MWh BESS Storage in Telangana
  const listingBessTG = await prisma.marketplaceListing.create({
    data: {
      listingCode: "LST-2026-TG-BES-04",
      organisationId: sellerOrgTG.id,
      title: "DEMO: 20 MW / 80 MWh Battery Energy Storage System (BESS) - Shamshabad",
      slug: "demo-20-mw-80-mwh-bess-shamshabad-telangana",
      category: "BATTERY_STORAGE",
      commercialModel: "ENERGY_STORAGE_SERVICE_AGREEMENT",
      state: "Telangana",
      projectLocation: "Hardware Park, Shamshabad, Hyderabad",
      totalCapacityMw: 20.0,
      availableCapacityMw: 10.0,
      indicativePricePerKwh: 4.80, // Availability + throughput fee
      priceBasisConditions: "Storage Service Agreement: Fixed capacity charge of ₹2.8 Lakh/MW/month plus ₹0.40/kWh throughput charge.",
      contractDurationYears: 10,
      expectedAvailabilityDate: new Date("2026-11-30"),
      interconnectionType: "STU_INTRA_STATE",
      projectStatus: "OPERATIONAL",
      isFeatured: true,
      status: "PUBLISHED",
      isDemoData: true,
      viewCount: 165,
      storageDetails: {
        create: {
          storageType: "Lithium Iron Phosphate (LFP) Grid-Scale BESS",
          powerCapacityMw: 20.0,
          energyCapacityMwh: 80.0,
          durationHours: 4.0,
          roundTripEfficiencyPct: 87.5,
          chargingEnergySource: "Off-peak Solar & Night-time Grid",
          commercialPricingModel: "Fixed Capacity + Throughput Availability Charge"
        }
      }
    }
  });

  // Listing 5: 100 MW / 600 MWh Pumped Hydro Storage (PSP) - Andhra / Telangana
  const listingPsp = await prisma.marketplaceListing.create({
    data: {
      listingCode: "LST-2026-TG-PSP-05",
      organisationId: sellerOrgTG.id,
      title: "DEMO: 100 MW / 600 MWh Off-Stream Pumped Storage Hydro Project - Nagarjuna Sagar Basin",
      slug: "demo-100-mw-600-mwh-pumped-storage-hydro-nagarjuna-sagar",
      category: "PUMPED_HYDRO_STORAGE",
      commercialModel: "ENERGY_STORAGE_SERVICE_AGREEMENT",
      state: "Telangana",
      projectLocation: "Nalgonda / Guntur Border, Telangana / Andhra Pradesh",
      totalCapacityMw: 100.0,
      availableCapacityMw: 30.0,
      indicativePricePerKwh: 4.20,
      priceBasisConditions: "6 hours daily peak discharge. Fixed monthly availability charge under long-term tolling agreement.",
      contractDurationYears: 25,
      expectedAvailabilityDate: new Date("2028-06-30"),
      interconnectionType: "CTU_INTER_STATE",
      projectStatus: "ADVANCED_DEVELOPMENT",
      regulatoryApprovals: "CEA concurrence & Environmental Clearance received.",
      isFeatured: false,
      status: "PUBLISHED",
      isDemoData: true,
      viewCount: 88,
      storageDetails: {
        create: {
          storageType: "Closed-loop Reversible Francis Pumped Storage",
          powerCapacityMw: 100.0,
          energyCapacityMwh: 600.0,
          durationHours: 6.0,
          roundTripEfficiencyPct: 78.0,
          chargingEnergySource: "Regional CTU Solar injection during 10:00 - 16:00",
          commercialPricingModel: "Tolling Model / Fixed Annual Capacity Availability"
        }
      }
    }
  });

  // Listing 6: 10 MW Solar-Wind Hybrid for Puducherry & Coastal Open Access
  const listingHybridPY = await prisma.marketplaceListing.create({
    data: {
      listingCode: "LST-2026-PY-HYB-07",
      organisationId: sellerOrgTN.id,
      title: "DEMO: 10 MW Solar-Wind Hybrid Project (4 MW Available) - Puducherry / Cuddalore Corridor",
      slug: "demo-10-mw-solar-wind-hybrid-puducherry-corridor",
      category: "HYBRID_RENEWABLE",
      commercialModel: "GROUP_CAPTIVE",
      state: "Puducherry",
      projectLocation: "Puducherry / Sedarapet & Cuddalore Industrial Interconnection Corridor",
      totalCapacityMw: 10.0,
      availableCapacityMw: 4.0,
      indicativePricePerKwh: 3.80,
      priceBasisConditions: "Ex-busbar at 22/33 kV sub-station. 15-year PPA. Group Captive SPV compliant with JERC Green Energy Open Access (GEOA) with ZERO CSS and ZERO Additional Surcharge.",
      contractDurationYears: 15,
      expectedAvailabilityDate: new Date("2026-11-15"),
      interconnectionType: "STU_INTRA_STATE",
      substationDetails: "Connected to 110/22 kV Sedarapet / Bahour Substation grid network.",
      projectStatus: "OPERATIONAL",
      regulatoryApprovals: "JERC Open Access in-principle approval, PED technical feasibility and CEIG electrical clearance documented.",
      isFeatured: true,
      status: "PUBLISHED",
      isDemoData: true,
      viewCount: 112,
      renewableDetails: {
        create: {
          technology: "Hybrid: 6 MW Solar Bifacial Mono-PERC + 4 MW High-CUF Wind Turbines",
          dcAcRatio: 1.34,
          cuFactorPercent: 35.8,
          expectedAnnualGenMu: 31.4,
          captiveStructureInfo: "Structured Group Captive SPV under JERC & Electricity Rules 2005 (26% equity holding / 51% proportional consumption).",
          bankingTerms: "Monthly energy banking settlement as per JERC Green Energy Open Access regulations."
        }
      }
    }
  });

  // 4. Create an active Enquiry between Buyer and Seller
  const demoEnquiry = await prisma.enquiry.create({
    data: {
      enquiryCode: "ENQ-2026-TG-001",
      listingId: listingSolarTG.id,
      buyerOrganisationId: buyerOrgTG.id,
      sellerOrganisationId: sellerOrgTG.id,
      requirementId: buyerReqTG.id,
      proposedCapacityMw: 5.0,
      message: "DEMO ENQUIRY: We are a bulk drug formulation unit in Jeedimetla with 6000 kVA contract demand. We are keen to off-take 5 MW under the Group Captive model. Please provide draft term sheet and SPV equity shareholding structure.",
      status: "RESPONSE_RECEIVED",
      buyerConsentGranted: true,
      messages: {
        create: [
          {
            senderUserId: buyerUserTG.id,
            senderOrgId: buyerOrgTG.id,
            senderName: "Rajesh Reddy (Hyderabad Pharma)",
            messageText: "Initiated procurement enquiry for 5 MW off-take under Group Captive structure."
          },
          {
            senderUserId: sellerUserTG.id,
            senderOrgId: sellerOrgTG.id,
            senderName: "Anand Rao (Deccan Green Power)",
            messageText: "Thank you for the enquiry. Our 10 MW Jadcherla solar plant is fully operational. We can allocate 5 MW via our SPV with 26% equity subscription. Transmitting indicative term sheet for your legal review."
          }
        ]
      }
    }
  });

  // 4b. Active Enquiry for Tamil Nadu Customer (Coimbatore Auto -> Kongu Renewables)
  const demoEnquiryTN = await prisma.enquiry.create({
    data: {
      enquiryCode: "ENQ-2026-TN-002",
      listingId: listingHybridTN.id,
      buyerOrganisationId: buyerOrgTN.id,
      sellerOrganisationId: sellerOrgTN.id,
      requirementId: buyerReqTN.id,
      proposedCapacityMw: 3.5,
      message: "DEMO ENQUIRY: Coimbatore Precision Auto seeking 3.5 MW off-take from your 15 MW Kayathar Hybrid plant under Group Captive. Please provide delivered landed tariff breakdown and SPV equity participation terms.",
      status: "NEGOTIATION",
      buyerConsentGranted: true,
      messages: {
        create: [
          {
            senderUserId: buyerUserTN.id,
            senderOrgId: buyerOrgTN.id,
            senderName: "Senthil Murugan (Coimbatore Auto)",
            messageText: "Hello Karthik, we are evaluating our Kurichi foundry power procurement. Our TANGEDCO HT-I rate is ₹8.75/kWh. We want to procure 3.5 MW under Group Captive to bypass CSS."
          },
          {
            senderUserId: sellerUserTN.id,
            senderOrgId: sellerOrgTN.id,
            senderName: "Karthik Natarajan (Kongu Renewables)",
            messageText: "Vanakkam Senthil. Our Kayathar plant has 6 MW available capacity on 33 kV TANTRANSCO network. Under Group Captive, your CSS and Additional Surcharge are ₹0. Landed cost will be approximately ₹5.04/kWh, saving you over ₹3.70 per unit (~₹3.1 Crore annually). Sharing term sheet."
          }
        ]
      }
    }
  });

  // 5. Create Tenders
  await prisma.tenderOpportunity.createMany({
    data: [
      {
        tenderRefNo: "TSSPDCL/RE/2026/04",
        issuingAuthority: "Southern Power Distribution Company of Telangana (TSSPDCL)",
        tenderType: "POWER_PROCUREMENT",
        title: "DEMO: Procurement of 500 MW Solar Power through Competitive Bidding for 25 Years",
        state: "Telangana",
        capacityMw: 500.0,
        estimatedValueInr: 125000, // Lakhs
        submissionDeadline: new Date("2026-12-15T17:00:00Z"),
        sourceUrl: "https://tgspdcl.cgg.gov.in/tenders",
        isVerifiedSource: true,
        isDemoData: true
      },
      {
        tenderRefNo: "SECI/C&P/IPP/14/BESS/2026",
        issuingAuthority: "Solar Energy Corporation of India (SECI)",
        tenderType: "BESS_STORAGE",
        title: "DEMO: Setting up of 1200 MWh Standalone Battery Energy Storage Systems in India",
        state: "Pan-India",
        capacityMw: 300.0,
        estimatedValueInr: 280000,
        submissionDeadline: new Date("2026-11-28T18:00:00Z"),
        sourceUrl: "https://seci.co.in/tenders",
        isVerifiedSource: true,
        isDemoData: true
      },
      {
        tenderRefNo: "GUVNL/PHASE-XXII/HYBRID/2026",
        issuingAuthority: "Gujarat Urja Vikas Nigam Limited (GUVNL)",
        tenderType: "RENEWABLE_ENERGY",
        title: "DEMO: Purchase of Power from 500 MW Grid Connected Wind-Solar Hybrid Projects",
        state: "Gujarat",
        capacityMw: 500.0,
        estimatedValueInr: 175000,
        submissionDeadline: new Date("2027-01-10T15:00:00Z"),
        sourceUrl: "https://guvnl.com/tenders",
        isVerifiedSource: true,
        isDemoData: true
      }
    ]
  });

  // 6. Create Energy Services & EPC Listings
  await prisma.serviceListing.createMany({
    data: [
      {
        serviceCode: "SRV-2026-ADV-01",
        organisationId: sellerOrgTG.id,
        title: "DEMO: Open Access Regulatory Advisory & Landed Cost Optimization",
        category: "OPEN_ACCESS_ADVISORY",
        description: "Specialized consultancy assisting HT consumers in Telangana, Andhra, and Karnataka in navigating TSERC/APERC open access regulations, DISCOM applications, and captive equity compliance audits.",
        geographicalCoverage: "Telangana, Andhra Pradesh, Karnataka, Maharashtra",
        qualifications: "Team of former TSERC/CEA technical directors and chartered electrical engineers with over 450 MW of successfully wheeled OA capacity.",
        pricingModel: "Milestone-based or % of verified first-year tariff savings",
        status: "PUBLISHED",
        isDemoData: true
      },
      {
        serviceCode: "SRV-2026-EPC-02",
        organisationId: sellerOrgTG.id,
        title: "DEMO: Turnkey Solar & BESS EPC Solutions for Industrial Rooftops and Ground Plants",
        category: "SOLAR_EPC",
        description: "Complete EPC engineering, procurement, statutory CEIG approvals, and 25-year comprehensive O&M for captive C&I solar power systems.",
        geographicalCoverage: "Pan-India",
        qualifications: "Tier-1 equipment partners, MNRE channel partner certified, ISO 9001:2015 accredited.",
        pricingModel: "Fixed Lump-Sum Turnkey (Capex) or Opex Resco",
        status: "PUBLISHED",
        isDemoData: true
      }
    ]
  });

  console.log("Seeding completed successfully with rich, domain-accurate DEMO DATA!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
