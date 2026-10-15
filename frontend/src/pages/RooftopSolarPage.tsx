import React, { useState, useEffect } from 'react';
import { 
  Sun, 
  Home, 
  Building2, 
  Users, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight, 
  Zap, 
  Calculator, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin, 
  TrendingUp, 
  Leaf, 
  Award, 
  Sparkles, 
  Percent, 
  Clock, 
  AlertCircle,
  FileCheck,
  ChevronRight,
  Filter,
  Search
} from 'lucide-react';
import { api } from '../services/api';
import { 
  RooftopEconomics, 
  RooftopVendor, 
  RooftopCampaign, 
  RooftopProposal, 
  RooftopApplicantType 
} from '../types';

interface RooftopSolarPageProps {
  setCurrentView: (view: string) => void;
}

const INITIAL_RWA_ECONOMICS: RooftopEconomics = {
  capacityKw: 35,
  monthlyGenUnits: 4375,
  annualGenUnits: 52500,
  grossTurnkeyCost: 1890000,
  centralSubsidyInr: 630000,
  netPayableInr: 1260000,
  monthlySavingsInr: 35656,
  annualSavingsInr: 427875,
  paybackYears: 2.9,
  lifetime25YrSavingsInr: 9627188,
  annualCo2MitigationTonnes: 43.1,
  subsidyProgram: "PM Surya Ghar: RWA Common Area Facility (₹18,000 / kW up to 500 kW)"
};

export const RooftopSolarPage: React.FC<RooftopSolarPageProps> = ({ setCurrentView }) => {
  // Active Persona
  const [applicantType, setApplicantType] = useState<RooftopApplicantType>('APARTMENT_RWA');
  
  // Calculator Form State
  const [monthlyBillInr, setMonthlyBillInr] = useState<number>(45000);
  const [availableRoofAreaSqFt, setAvailableRoofAreaSqFt] = useState<number>(3000);
  const [desiredCapacityKw, setDesiredCapacityKw] = useState<number | undefined>(undefined);
  const [roofType, setRoofType] = useState<'RCC_FLAT' | 'SLOPED_SHEET' | 'TILED' | 'OTHER'>('RCC_FLAT');
  const [city, setCity] = useState<string>('Coimbatore');

  // Economics Results
  const [economics, setEconomics] = useState<RooftopEconomics>(INITIAL_RWA_ECONOMICS);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);

  // Vendor & Campaign Directory
  const [vendors, setVendors] = useState<RooftopVendor[]>([]);
  const [campaigns, setCampaigns] = useState<RooftopCampaign[]>([]);
  const [selectedDistrictFilter, setSelectedDistrictFilter] = useState<string>('ALL');
  const [vendorSearchQuery, setVendorSearchQuery] = useState<string>('');

  // Proposal Forwarding Modal / Form
  const [showProposalModal, setShowProposalModal] = useState<boolean>(false);
  const [selectedVendorForProposal, setSelectedVendorForProposal] = useState<string | null>(null);
  const [proposalFormData, setProposalFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    apartmentName: '',
    numberOfFlats: 64,
    ebConsumerNumber: '',
    preferredModel: 'CAPEX' as 'CAPEX' | 'RESCO_OPEX',
    notes: ''
  });
  const [isSubmittingProposal, setIsSubmittingProposal] = useState<boolean>(false);
  const [submittedProposalResult, setSubmittedProposalResult] = useState<{
    proposal: RooftopProposal;
    economics: RooftopEconomics;
    forwardedVendors: RooftopVendor[];
  } | null>(null);

  // Campaign Registration Modal
  const [showCampaignModal, setShowCampaignModal] = useState<boolean>(false);
  const [selectedCampaign, setSelectedCampaign] = useState<RooftopCampaign | null>(null);
  const [campaignFormData, setCampaignFormData] = useState({
    societyName: '',
    associationRegNumber: '',
    secretaryName: '',
    contactPhone: '',
    contactEmail: '',
    city: 'Chennai',
    numberOfUnits: 80,
    estimatedCommonAreaLoadKw: 25,
    preferredDateForOrientation: ''
  });
  const [isSubmittingCampaign, setIsSubmittingCampaign] = useState<boolean>(false);
  const [campaignSuccessMsg, setCampaignSuccessMsg] = useState<string | null>(null);

  // Default bills and roof area per persona
  const handlePersonaChange = (type: RooftopApplicantType) => {
    setApplicantType(type);
    if (type === 'INDIVIDUAL') {
      setMonthlyBillInr(4500);
      setAvailableRoofAreaSqFt(400);
      setDesiredCapacityKw(undefined);
    } else if (type === 'APARTMENT_OWNER') {
      setMonthlyBillInr(3500);
      setAvailableRoofAreaSqFt(250);
      setDesiredCapacityKw(undefined);
    } else if (type === 'APARTMENT_RWA') {
      setMonthlyBillInr(55000);
      setAvailableRoofAreaSqFt(4500);
      setDesiredCapacityKw(undefined);
      setProposalFormData(prev => ({ ...prev, apartmentName: 'Greenwood Heights RWA' }));
    } else {
      setMonthlyBillInr(85000);
      setAvailableRoofAreaSqFt(6000);
      setDesiredCapacityKw(undefined);
    }
  };

  // Re-calculate economics on input change
  useEffect(() => {
    let isMounted = true;
    async function fetchCalc() {
      if (monthlyBillInr <= 0) return;
      setIsCalculating(true);
      try {
        const res = await api.calculateRooftopEstimate({
          applicantType,
          monthlyBillInr,
          availableRoofAreaSqFt: availableRoofAreaSqFt || undefined,
          desiredCapacityKw: desiredCapacityKw || undefined
        });
        if (isMounted) setEconomics(res);
      } catch (err) {
        console.error("Feasibility calc failed:", err);
      } finally {
        if (isMounted) setIsCalculating(false);
      }
    }
    const timer = setTimeout(fetchCalc, 200);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [applicantType, monthlyBillInr, availableRoofAreaSqFt, desiredCapacityKw]);

  // Load vendors and campaigns
  useEffect(() => {
    async function loadData() {
      try {
        const [vList, cList] = await Promise.all([
          api.getRooftopVendors(),
          api.getRooftopCampaigns()
        ]);
        setVendors(vList);
        setCampaigns(cList);
      } catch (err) {
        console.error("Error loading rooftop data:", err);
      }
    }
    loadData();
  }, []);

  // Filter vendors
  const filteredVendors = (vendors || []).filter(v => {
    const coveredDistricts = v.coveredDistricts || [];
    const specs = v.specialization || [];
    const vCity = v.registeredCity || '';
    const name = v.name || '';
    const tradeName = v.tradeName || '';

    const matchesDistrict = selectedDistrictFilter === 'ALL' || 
      vCity.toLowerCase().includes(selectedDistrictFilter.toLowerCase()) ||
      coveredDistricts.some(d => d.toLowerCase().includes(selectedDistrictFilter.toLowerCase()));
    
    const q = vendorSearchQuery ? vendorSearchQuery.toLowerCase().trim() : '';
    const matchesSearch = !q ||
      name.toLowerCase().includes(q) ||
      tradeName.toLowerCase().includes(q) ||
      vCity.toLowerCase().includes(q) ||
      specs.some(s => s.toLowerCase().includes(q));

    return matchesDistrict && matchesSearch;
  });

  // Handle Proposal Submission
  const handleProposalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposalFormData.fullName || !proposalFormData.phone || !city) {
      alert("Please enter your name, contact phone number, and city.");
      return;
    }

    setIsSubmittingProposal(true);
    try {
      const res = await api.createRooftopProposal({
        applicantType,
        fullName: proposalFormData.fullName,
        phone: proposalFormData.phone,
        email: proposalFormData.email || `${proposalFormData.phone.replace(/\D/g, '')}@lead.electricitybazaar.in`,
        city,
        district: city,
        apartmentName: proposalFormData.apartmentName || undefined,
        numberOfFlats: proposalFormData.numberOfFlats || undefined,
        ebConsumerNumber: proposalFormData.ebConsumerNumber || undefined,
        monthlyBillInr,
        availableRoofAreaSqFt,
        roofType,
        desiredCapacityKw: economics?.capacityKw,
        preferredModel: proposalFormData.preferredModel,
        targetEpcVendorIds: selectedVendorForProposal ? [selectedVendorForProposal] : [],
        notes: proposalFormData.notes
      });
      setSubmittedProposalResult(res);
    } catch (err: any) {
      alert(`Proposal creation error: ${err.message || 'Failed to submit'}`);
    } finally {
      setIsSubmittingProposal(false);
    }
  };

  // Handle Campaign Signup
  const handleCampaignSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignFormData.societyName || !campaignFormData.secretaryName || !campaignFormData.contactPhone) {
      alert("Please provide the society name, representative name, and contact phone number.");
      return;
    }

    setIsSubmittingCampaign(true);
    try {
      const res = await api.registerRooftopCampaign({
        campaignId: selectedCampaign?.id || 'cmp-tn-apt-01',
        ...campaignFormData
      });
      setCampaignSuccessMsg(
        `Success! Apartment Association "${res.societyName}" has been registered for the campaign. Our nodal engineering officer will coordinate orientation.`
      );
    } catch (err: any) {
      alert(`Campaign registration error: ${err.message || 'Failed to register'}`);
    } finally {
      setIsSubmittingCampaign(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 pb-20">
      {/* Hero Header */}
      <div className="bg-gradient-to-b from-navy-900 via-navy-800 to-navy-900 text-white pt-12 pb-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800 relative overflow-hidden">
        {/* Glow ambient decoration */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="inline-flex items-center space-x-2 bg-amber-500/10 border border-amber-500/30 text-amber-300 px-3.5 py-1.5 rounded-full text-xs font-semibold">
              <Sun className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '12s' }} />
              <span>Tamil Nadu Flagship Pilot: Rooftop Solar & RWA Aggregation Hub</span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>PM Surya Ghar: Muft Bijli Yojana Central Subsidies Enabled</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                Rooftop Solar for <span className="text-amber-400">Homes</span>, <span className="text-teal-400">Apartments</span> & <span className="text-sky-400">RWAs</span>
              </h1>
              <p className="text-slate-300 text-base sm:text-lg max-w-3xl leading-relaxed">
                Unlock direct subsidies up to <strong className="text-white">₹78,000 for independent homes</strong> and <strong className="text-white">₹18,000/kW for Apartment Resident Welfare Associations (RWAs)</strong> in Tamil Nadu. Calculate feasibility, connect with verified TANGEDCO-empanelled EPC vendors, and slash electricity tariffs to zero.
              </p>

              <div className="pt-2 flex flex-wrap gap-3">
                <a 
                  href="#calculator-section"
                  className="bg-amber-500 hover:bg-amber-400 text-navy-950 font-bold px-5 py-2.5 rounded-lg shadow-lg shadow-amber-500/20 text-sm flex items-center space-x-2 transition"
                >
                  <Calculator className="w-4 h-4" />
                  <span>Calculate Feasibility & Subsidy</span>
                </a>
                <a 
                  href="#campaigns-section"
                  className="bg-navy-700 hover:bg-navy-600 text-teal-300 border border-teal-500/30 px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center space-x-2 transition"
                >
                  <Sparkles className="w-4 h-4 text-teal-400" />
                  <span>Apartment Community Campaigns</span>
                </a>
                <a 
                  href="#epc-directory"
                  className="bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700 px-5 py-2.5 rounded-lg text-sm font-medium flex items-center space-x-2 transition"
                >
                  <Award className="w-4 h-4 text-slate-400" />
                  <span>Empanelled TN EPC Contractors</span>
                </a>
              </div>
            </div>

            {/* Quick KPI Highlights */}
            <div className="lg:col-span-4 grid grid-cols-2 gap-3">
              <div className="bg-navy-800/80 border border-slate-700/80 rounded-xl p-4 backdrop-blur-sm">
                <div className="text-amber-400 text-2xl font-black">₹78,000</div>
                <div className="text-xs text-slate-300 font-semibold mt-0.5">PM Surya Ghar Subsidy</div>
                <div className="text-[11px] text-slate-400 mt-1">Direct DBT for 3 kW+ Homes</div>
              </div>
              <div className="bg-navy-800/80 border border-slate-700/80 rounded-xl p-4 backdrop-blur-sm">
                <div className="text-teal-400 text-2xl font-black">₹18,000 / kW</div>
                <div className="text-xs text-slate-300 font-semibold mt-0.5">Apartment RWA Subsidy</div>
                <div className="text-[11px] text-slate-400 mt-1">Up to 500 kW common facilities</div>
              </div>
              <div className="bg-navy-800/80 border border-slate-700/80 rounded-xl p-4 backdrop-blur-sm">
                <div className="text-sky-400 text-2xl font-black">3.2 - 3.8 Yrs</div>
                <div className="text-xs text-slate-300 font-semibold mt-0.5">Average Payback</div>
                <div className="text-[11px] text-slate-400 mt-1">21+ years of free electricity</div>
              </div>
              <div className="bg-navy-800/80 border border-slate-700/80 rounded-xl p-4 backdrop-blur-sm">
                <div className="text-emerald-400 text-2xl font-black">5 Cities</div>
                <div className="text-xs text-slate-300 font-semibold mt-0.5">Launch Coverage</div>
                <div className="text-[11px] text-slate-400 mt-1">Coimbatore, Chennai, Madurai, Trichy, Salem</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        {/* Persona Selector Tabs */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-2 sm:p-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <button
              onClick={() => handlePersonaChange('INDIVIDUAL')}
              className={`flex items-center space-x-3 p-3.5 rounded-xl border transition-all text-left ${
                applicantType === 'INDIVIDUAL'
                  ? 'bg-amber-50/80 border-amber-500/60 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className={`p-2 rounded-lg ${applicantType === 'INDIVIDUAL' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                <Home className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-xs sm:text-sm text-slate-900">Individual Home / Villa</div>
                <div className="text-[11px] text-slate-500">1 kW - 10 kW (Tariff 1A)</div>
              </div>
            </button>

            <button
              onClick={() => handlePersonaChange('APARTMENT_OWNER')}
              className={`flex items-center space-x-3 p-3.5 rounded-xl border transition-all text-left ${
                applicantType === 'APARTMENT_OWNER'
                  ? 'bg-sky-50/80 border-sky-500/60 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className={`p-2 rounded-lg ${applicantType === 'APARTMENT_OWNER' ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-xs sm:text-sm text-slate-900">Apartment Flat Owner</div>
                <div className="text-[11px] text-slate-500">Terrace slot or individual meter</div>
              </div>
            </button>

            <button
              onClick={() => handlePersonaChange('APARTMENT_RWA')}
              className={`flex items-center space-x-3 p-3.5 rounded-xl border transition-all text-left ${
                applicantType === 'APARTMENT_RWA'
                  ? 'bg-teal-50/80 border-teal-500/60 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className={`p-2 rounded-lg ${applicantType === 'APARTMENT_RWA' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-xs sm:text-sm text-slate-900">Apartment RWA / Society</span>
                  <span className="text-[9px] bg-teal-600 text-white font-extrabold px-1.5 py-0.2 rounded uppercase">Pilot Focus</span>
                </div>
                <div className="text-[11px] text-slate-500">Common Area (Tariff 1D) 10-500kW</div>
              </div>
            </button>

            <button
              onClick={() => handlePersonaChange('COMMERCIAL')}
              className={`flex items-center space-x-3 p-3.5 rounded-xl border transition-all text-left ${
                applicantType === 'COMMERCIAL'
                  ? 'bg-indigo-50/80 border-indigo-500/60 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className={`p-2 rounded-lg ${applicantType === 'COMMERCIAL' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-xs sm:text-sm text-slate-900">Commercial / MSME Shed</div>
                <div className="text-[11px] text-slate-500">Accelerated 40% depreciation</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Main Calculator & Live Results */}
      <div id="calculator-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Calculator Controls */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center space-x-2.5">
                  <Calculator className="w-5 h-5 text-teal-600" />
                  <h2 className="text-lg font-extrabold text-slate-900">
                    {applicantType === 'APARTMENT_RWA' 
                      ? 'Apartment RWA Common Area Sizing' 
                      : applicantType === 'INDIVIDUAL' 
                      ? 'Home Solar Feasibility' 
                      : 'Rooftop System Sizing'}
                  </h2>
                </div>
                <span className="text-xs bg-slate-100 font-semibold text-slate-600 px-2.5 py-1 rounded-full">
                  Tamil Nadu (TANGEDCO)
                </span>
              </div>

              {/* Monthly Electricity Bill */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {applicantType === 'APARTMENT_RWA' 
                      ? 'Monthly Common Area Bill (Lifts, STP, Lighting, Pumps)' 
                      : 'Average Monthly EB Bill (₹)'}
                  </label>
                  <span className="text-sm font-black text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded border border-teal-200">
                    ₹{monthlyBillInr.toLocaleString('en-IN')} / mo
                  </span>
                </div>
                <input
                  type="range"
                  min={applicantType === 'INDIVIDUAL' || applicantType === 'APARTMENT_OWNER' ? 1000 : 10000}
                  max={applicantType === 'INDIVIDUAL' || applicantType === 'APARTMENT_OWNER' ? 25000 : 500000}
                  step={applicantType === 'INDIVIDUAL' || applicantType === 'APARTMENT_OWNER' ? 500 : 5000}
                  value={monthlyBillInr}
                  onChange={(e) => setMonthlyBillInr(Number(e.target.value))}
                  className="w-full accent-teal-600 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>{applicantType === 'APARTMENT_RWA' ? '₹10,000' : '₹1,000'}</span>
                  <span>{applicantType === 'APARTMENT_RWA' ? '₹2,50,000' : '₹12,000'}</span>
                  <span>{applicantType === 'APARTMENT_RWA' ? '₹5,00,000' : '₹25,000'}</span>
                </div>
              </div>

              {/* Available Roof Area */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Estimated Shadow-Free Roof Area (sq. ft)
                  </label>
                  <span className="text-sm font-bold text-slate-800">
                    {availableRoofAreaSqFt.toLocaleString('en-IN')} sq. ft
                  </span>
                </div>
                <input
                  type="range"
                  min={applicantType === 'INDIVIDUAL' || applicantType === 'APARTMENT_OWNER' ? 100 : 500}
                  max={applicantType === 'INDIVIDUAL' || applicantType === 'APARTMENT_OWNER' ? 2000 : 40000}
                  step={applicantType === 'INDIVIDUAL' || applicantType === 'APARTMENT_OWNER' ? 50 : 500}
                  value={availableRoofAreaSqFt}
                  onChange={(e) => setAvailableRoofAreaSqFt(Number(e.target.value))}
                  className="w-full accent-teal-600 cursor-pointer"
                />
                <p className="text-[11px] text-slate-500">
                  Tip: 1 kWp of Tier-1 solar requires approx 80 - 100 sq. ft of shadow-free terrace space in Tamil Nadu.
                </p>
              </div>

              {/* Location & Roof Details */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Tamil Nadu City / District
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full text-xs font-semibold border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="Coimbatore">Coimbatore (Kongu Belt)</option>
                    <option value="Chennai">Chennai (Greater Metro)</option>
                    <option value="Madurai">Madurai (Southern Hub)</option>
                    <option value="Trichy">Tiruchirappalli (Trichy)</option>
                    <option value="Salem">Salem</option>
                    <option value="Tiruppur">Tiruppur</option>
                    <option value="Erode">Erode</option>
                    <option value="Chengalpattu">Chengalpattu / OMR</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Roof Construction
                  </label>
                  <select
                    value={roofType}
                    onChange={(e) => setRoofType(e.target.value as any)}
                    className="w-full text-xs font-semibold border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="RCC_FLAT">RCC Flat Terrace</option>
                    <option value="SLOPED_SHEET">Sloped Metal Sheet (GI/Colour)</option>
                    <option value="TILED">Clay Tiled / Mangalore Tiles</option>
                    <option value="OTHER">Elevated Super-Structure</option>
                  </select>
                </div>
              </div>

              {/* TANGEDCO Tariff Context Card */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 text-xs space-y-1.5">
                <div className="flex items-center space-x-1.5 font-bold text-slate-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>
                    {applicantType === 'APARTMENT_RWA' 
                      ? 'TANGEDCO Tariff 1D (Apartment Common Services)' 
                      : 'TANGEDCO Tariff 1A (Domestic LT)'}
                  </span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  {applicantType === 'APARTMENT_RWA'
                    ? 'Apartment common utilities are billed at flat ~₹8.15 / kWh. Rooftop solar net-metering offsets high-cost grid imports first, yielding fastest payback in high-rise societies.'
                    : 'Domestic slabs range from ₹4.50 to ₹9.00 / kWh with bi-monthly billing. Net metering offsets tier-3 peak consumption.'}
                </p>
              </div>

              <button
                onClick={() => {
                  setSelectedVendorForProposal(null);
                  setShowProposalModal(true);
                }}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded-xl shadow-md shadow-teal-600/20 text-sm flex items-center justify-center space-x-2 transition"
              >
                <span>Request Free Site Survey & 3 EPC Quotes</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Column: Economics & Payback Dashboard */}
          <div className="lg:col-span-7 space-y-6">
            {isCalculating ? (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center space-y-3">
                <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Computing TANGEDCO Feasibility & PM Surya Ghar Subsidy...
                </p>
              </div>
            ) : economics ? (
              <div className="space-y-6">
                {/* Main Results Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-navy-900 to-navy-800 text-white p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <span className="text-[11px] font-mono tracking-wider text-teal-400 uppercase font-semibold">
                          Recommended Capacity Sizing
                        </span>
                        <div className="flex items-baseline space-x-2 mt-0.5">
                          <span className="text-3xl sm:text-4xl font-black text-white">{economics.capacityKw} kWp</span>
                          <span className="text-slate-300 text-xs font-medium">On-Grid Rooftop Solar</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-slate-300 block">Est. Monthly Generation</span>
                        <span className="text-xl sm:text-2xl font-bold text-amber-300">
                          ~{economics.monthlyGenUnits.toLocaleString('en-IN')} kWh/mo
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {economics.annualGenUnits.toLocaleString('en-IN')} units / year
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Pricing & Subsidy Breakdown Grid */}
                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                        <span className="text-[11px] text-slate-500 uppercase font-bold tracking-wider block">
                          Turnkey Benchmark Cost
                        </span>
                        <div className="text-xl font-black text-slate-900 mt-1">
                          ₹{economics.grossTurnkeyCost.toLocaleString('en-IN')}
                        </div>
                        <span className="text-[11px] text-slate-400 mt-0.5 block">
                          ~₹{(economics.grossTurnkeyCost / economics.capacityKw).toLocaleString('en-IN')}/kW turnkey
                        </span>
                      </div>

                      <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-emerald-800 uppercase font-bold tracking-wider">
                            Central Subsidy
                          </span>
                          <span className="text-[9px] bg-emerald-600 text-white font-extrabold px-1.5 py-0.2 rounded">
                            DBT
                          </span>
                        </div>
                        <div className="text-xl font-black text-emerald-700 mt-1">
                          - ₹{economics.centralSubsidyInr.toLocaleString('en-IN')}
                        </div>
                        <span className="text-[11px] text-emerald-600 mt-0.5 block truncate" title={economics.subsidyProgram || 'PM Surya Ghar'}>
                          {(economics.subsidyProgram || 'PM Surya Ghar: Subsidy').split(':')[0]}
                        </span>
                      </div>

                      <div className="bg-teal-50/70 rounded-xl p-4 border border-teal-300">
                        <span className="text-[11px] text-teal-900 uppercase font-bold tracking-wider block">
                          Net Out-of-Pocket
                        </span>
                        <div className="text-2xl font-black text-teal-800 mt-1">
                          ₹{economics.netPayableInr.toLocaleString('en-IN')}
                        </div>
                        <span className="text-[11px] text-teal-600 font-semibold mt-0.5 block">
                          Payback: {economics.paybackYears} Years
                        </span>
                      </div>
                    </div>

                    {/* Financial Return Metric Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
                          <TrendingUp className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 font-medium">Monthly Bill Reduction</div>
                          <div className="text-lg font-bold text-slate-900">
                            ₹{economics.monthlySavingsInr.toLocaleString('en-IN')} / mo
                          </div>
                          <div className="text-[11px] text-emerald-600 font-semibold">
                            ₹{economics.annualSavingsInr.toLocaleString('en-IN')} / year
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-sky-100 text-sky-700 rounded-lg">
                          <Zap className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 font-medium">25-Year Net Savings</div>
                          <div className="text-lg font-bold text-slate-900">
                            ₹{(economics.lifetime25YrSavingsInr / 100000).toFixed(2)} Lakhs
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Assumes 3% annual grid escalation
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                          <Leaf className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 font-medium">CO2 Clean Offset</div>
                          <div className="text-lg font-bold text-slate-900">
                            {economics.annualCo2MitigationTonnes} Tonnes
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Equivalent to planting ~{Math.round(economics.annualCo2MitigationTonnes * 16)} trees/yr
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Subsidy Information Callout */}
                    <div className="bg-amber-50/70 border border-amber-200/90 rounded-xl p-4 flex items-start space-x-3">
                      <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="text-xs space-y-1">
                        <div className="font-bold text-amber-900">
                          {economics.subsidyProgram}
                        </div>
                        <p className="text-amber-800 leading-relaxed text-[11px]">
                          {applicantType === 'APARTMENT_RWA' ? (
                            <>
                              Apartment Resident Welfare Associations (RWAs) in Tamil Nadu qualify for <strong className="font-semibold">₹18,000 per kW central subsidy</strong> up to 500 kW capacity for lighting, water pumping, sewage treatment plants, and lifts under the National PM Surya Ghar Scheme.
                            </>
                          ) : applicantType === 'INDIVIDUAL' || applicantType === 'APARTMENT_OWNER' ? (
                            <>
                              Direct Benefit Transfer (DBT) is credited straight into your bank account via the National Rooftop Portal within 30 days of TANGEDCO bi-directional meter commissioning.
                            </>
                          ) : (
                            <>
                              Commercial units benefit from 40% accelerated depreciation in Year 1 under Section 32 of the Income Tax Act, plus concessional priority sector green credit.
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <button
                        onClick={() => {
                          setSelectedVendorForProposal(null);
                          setShowProposalModal(true);
                        }}
                        className="flex-1 bg-navy-900 hover:bg-navy-800 text-white font-bold py-3 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center space-x-2 transition shadow-sm"
                      >
                        <FileCheck className="w-4 h-4 text-teal-400" />
                        <span>Forward Feasibility to Empanelled EPCs</span>
                      </button>
                      
                      {applicantType === 'APARTMENT_RWA' && (
                        <button
                          onClick={() => {
                            const aptCampaign = campaigns.find(c => c.id === 'cmp-tn-apt-01') || campaigns[0];
                            setSelectedCampaign(aptCampaign);
                            setShowCampaignModal(true);
                          }}
                          className="bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 font-bold py-3 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center space-x-2 transition"
                        >
                          <Building2 className="w-4 h-4 text-teal-600" />
                          <span>Join RWA Community Campaign</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Active Promotional Campaigns Section */}
      <div id="campaigns-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-1 bg-amber-500/20 text-amber-600 rounded-md">
                <Sparkles className="w-4 h-4" />
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Active Tamil Nadu Promotional Campaigns
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Bulk aggregation drives and exclusive community subsidies negotiated for Tamil Nadu residents.
            </p>
          </div>
          <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
            {campaigns.length} Active Campaigns in TN
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {campaigns.map((camp) => (
            <div 
              key={camp.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
            >
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded">
                    {camp.targetAudience}
                  </span>
                  <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                    {camp.discountOffer}
                  </span>
                </div>

                <div>
                  <h3 className="font-extrabold text-base text-slate-900 leading-snug">{camp.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">{camp.tagline || (camp as any).bannerHighlight}</p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  {((camp.highlights || (camp as any).benefits || []) as string[]).map((h, idx) => (
                    <div key={idx} className="flex items-start space-x-2 text-xs text-slate-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 flex-shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70 text-[11px] space-y-1">
                  <div className="flex justify-between text-slate-500">
                    <span>Coverage:</span>
                    <span className="font-semibold text-slate-800">{camp.coverageArea || (camp as any).region || 'Tamil Nadu'}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Valid Till:</span>
                    <span className="font-semibold text-slate-800">{camp.validTill || (camp as any).expiryDate || 'Active'}</span>
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0">
                <button
                  onClick={() => {
                    setSelectedCampaign(camp);
                    setShowCampaignModal(true);
                  }}
                  className="w-full bg-navy-900 hover:bg-navy-800 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition"
                >
                  <span>{camp.ctaText || 'Join Campaign'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Empanelled EPC Contractors Directory */}
      <div id="epc-directory" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-1 bg-teal-500/20 text-teal-600 rounded-md">
                <Award className="w-4 h-4" />
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Empanelled Tamil Nadu Rooftop EPC Vendors
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Vetted engineering contractors with MNRE empanelment and TANGEDCO vendor registration.
            </p>
          </div>

          {/* District Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            {['ALL', 'Coimbatore', 'Chennai', 'Madurai', 'Trichy', 'Salem'].map((dist) => (
              <button
                key={dist}
                onClick={() => setSelectedDistrictFilter(dist)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                  selectedDistrictFilter === dist
                    ? 'bg-white text-navy-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {dist === 'ALL' ? 'All Districts' : dist}
              </button>
            ))}
          </div>
        </div>

        {/* Vendors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVendors.map((vendor) => (
            <div 
              key={vendor.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
            >
              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      {vendor.registeredCity} Hub
                    </span>
                    <h3 className="font-extrabold text-base text-slate-900 mt-1 leading-snug">
                      {vendor.name}
                    </h3>
                    <span className="text-xs font-semibold text-slate-500">{vendor.tradeName}</span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="inline-flex items-center space-x-1 bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200 font-bold text-xs">
                      <span>★</span>
                      <span>{vendor.rating}</span>
                      <span className="text-slate-400 font-normal">({vendor.reviewCount})</span>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-mono">
                  {vendor.badge}
                </div>

                {/* Vendor Stats */}
                <div className="grid grid-cols-3 gap-2 text-center py-2 border-y border-slate-100">
                  <div>
                    <div className="text-sm font-bold text-slate-800">{vendor.experienceYears}+ Yrs</div>
                    <div className="text-[10px] text-slate-400 uppercase">Experience</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-800">{vendor.rooftopProjectsCompleted}+</div>
                    <div className="text-[10px] text-slate-400 uppercase">Projects</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-teal-700">{vendor.totalInstalledCapacityMw} MW</div>
                    <div className="text-[10px] text-slate-400 uppercase">Installed</div>
                  </div>
                </div>

                {/* Covered Districts */}
                <div className="text-xs space-y-1">
                  <div className="text-slate-400 text-[11px] font-medium">Covered Districts:</div>
                  <div className="flex flex-wrap gap-1">
                    {(vendor.coveredDistricts || []).map((d, i) => (
                      <span key={i} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        {d}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Specializations */}
                <div className="text-xs space-y-1">
                  <div className="text-slate-400 text-[11px] font-medium">Specialization:</div>
                  <div className="flex flex-wrap gap-1">
                    {(vendor.specialization || []).map((s, i) => (
                      <span key={i} className="text-[10px] bg-sky-50 text-sky-800 px-2 py-0.5 rounded border border-sky-100 font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Pricing & Warranties */}
                <div className="text-[11px] bg-slate-50 p-3 rounded-xl border border-slate-200/60 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Benchmark Turnkey Rate:</span>
                    <span className="font-bold text-slate-800">₹{vendor.turnkeyRatePerWattInr}/Wp (₹{vendor.turnkeyRatePerWattInr * 1000}/kW)</span>
                  </div>
                  <div className="text-slate-600 text-[10px] leading-tight pt-1 border-t border-slate-200/50">
                    <strong className="text-slate-700">Warranty:</strong> {vendor.warrantyOffered}
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0">
                <button
                  onClick={() => {
                    setSelectedVendorForProposal(vendor.id);
                    setShowProposalModal(true);
                  }}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition"
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>Request Quote from {vendor.tradeName}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TANGEDCO Net Metering & Feasibility Workflow Guide */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-black text-slate-900">
              Tamil Nadu Rooftop Solar & TANGEDCO Net Metering Process
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Electricity Bazaar coordinates the complete end-to-end liaison with TANGEDCO and CEIG for smooth approval.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
              <div className="w-7 h-7 rounded-full bg-teal-600 text-white flex items-center justify-center font-black text-xs">
                1
              </div>
              <h4 className="font-bold text-sm text-slate-900">Feasibility & TFR Filing</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Empanelled EPC inspects roof orientation, sanctions load check, and files online Technical Feasibility Report (TFR) with TANGEDCO.
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
              <div className="w-7 h-7 rounded-full bg-teal-600 text-white flex items-center justify-center font-black text-xs">
                2
              </div>
              <h4 className="font-bold text-sm text-slate-900">EPC Turnkey Installation</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Supply of DCR compliant ALMM mono-PERC / bifacial solar modules, Tier-1 inverters, wind-resistant aluminium mounting structures, and AC/DC protection.
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
              <div className="w-7 h-7 rounded-full bg-teal-600 text-white flex items-center justify-center font-black text-xs">
                3
              </div>
              <h4 className="font-bold text-sm text-slate-900">CEIG & Bi-directional Net Meter</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                CEIG safety clearance inspection (for systems &gt;10 kW), synchronization test, and replacement of existing meter with TANGEDCO bi-directional net meter.
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
              <div className="w-7 h-7 rounded-full bg-teal-600 text-white flex items-center justify-center font-black text-xs">
                4
              </div>
              <h4 className="font-bold text-sm text-slate-900">Direct Subsidy Disbursement</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Commissioning certificate uploaded to the National Portal. PM Surya Ghar DBT subsidy (up to ₹78,000 / ₹18,000/kW) disbursed directly to consumer bank account.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* PROPOSAL MODAL */}
      {showProposalModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative my-8">
            <button
              onClick={() => {
                setShowProposalModal(false);
                setSubmittedProposalResult(null);
              }}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 text-lg font-bold"
            >
              ✕
            </button>

            {submittedProposalResult ? (
              <div className="space-y-5 text-center py-4">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">Proposal Successfully Forwarded!</h3>
                  <div className="inline-block mt-2 bg-slate-100 text-slate-700 font-mono text-xs px-3 py-1 rounded-full font-bold">
                    Proposal Code: {submittedProposalResult.proposal.proposalCode}
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 text-left text-xs space-y-2 border border-slate-200">
                  <div className="font-bold text-slate-800">Forwarded to Empanelled EPC Vendors:</div>
                  {submittedProposalResult.forwardedVendors.map(v => (
                    <div key={v.id} className="flex justify-between items-center p-2 bg-white rounded border border-slate-200">
                      <div>
                        <div className="font-bold text-slate-900">{v.tradeName}</div>
                        <div className="text-[11px] text-slate-500">{v.registeredCity} • {v.phone}</div>
                      </div>
                      <span className="text-[10px] bg-teal-50 text-teal-700 font-bold px-2 py-0.5 rounded">
                        Lead Dispatched
                      </span>
                    </div>
                  ))}
                </div>

                <div className="text-xs text-slate-500 leading-relaxed">
                  The vendor engineers will reach out to schedule a complimentary shadow analysis and structural terrace inspection in <strong className="text-slate-800">{city}</strong>.
                </div>

                <button
                  onClick={() => {
                    setShowProposalModal(false);
                    setSubmittedProposalResult(null);
                  }}
                  className="w-full bg-navy-900 text-white font-bold py-2.5 rounded-xl text-sm"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleProposalSubmit} className="space-y-4">
                <div>
                  <span className="text-[11px] font-mono uppercase text-teal-600 font-bold">
                    {selectedVendorForProposal 
                      ? `Quote Request: ${vendors.find(v => v.id === selectedVendorForProposal)?.tradeName}` 
                      : 'Request Site Survey & Quotes'}
                  </span>
                  <h3 className="text-xl font-black text-slate-900 mt-0.5">
                    {applicantType === 'APARTMENT_RWA' ? 'Apartment RWA Proposal Submission' : 'Rooftop Solar Site Survey'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    System Sizing: <strong className="text-slate-800">{economics?.capacityKw} kWp</strong> • City: <strong className="text-slate-800">{city}</strong>
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Name of Applicant / Secretary *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. S. Ramanathan / President RWA"
                      value={proposalFormData.fullName}
                      onChange={(e) => setProposalFormData({ ...proposalFormData, fullName: e.target.value })}
                      className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Contact Phone *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="+91 98401 XXXXX"
                        value={proposalFormData.phone}
                        onChange={(e) => setProposalFormData({ ...proposalFormData, phone: e.target.value })}
                        className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        placeholder="secretary@apartment.demo"
                        value={proposalFormData.email}
                        onChange={(e) => setProposalFormData({ ...proposalFormData, email: e.target.value })}
                        className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {applicantType === 'APARTMENT_RWA' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Apartment / Society Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Greenwood Heights"
                          value={proposalFormData.apartmentName}
                          onChange={(e) => setProposalFormData({ ...proposalFormData, apartmentName: e.target.value })}
                          className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Number of Flats / Units
                        </label>
                        <input
                          type="number"
                          value={proposalFormData.numberOfFlats}
                          onChange={(e) => setProposalFormData({ ...proposalFormData, numberOfFlats: Number(e.target.value) })}
                          className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        TANGEDCO EB Consumer Number (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 03-125-004-981"
                        value={proposalFormData.ebConsumerNumber}
                        onChange={(e) => setProposalFormData({ ...proposalFormData, ebConsumerNumber: e.target.value })}
                        className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Commercial Model
                      </label>
                      <select
                        value={proposalFormData.preferredModel}
                        onChange={(e) => setProposalFormData({ ...proposalFormData, preferredModel: e.target.value as any })}
                        className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white"
                      >
                        <option value="CAPEX">Direct CAPEX (Own & Avail Subsidy)</option>
                        <option value="RESCO_OPEX">Zero-Capex RESCO (PPA at ₹5.50/unit)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Additional Notes / Special Requirements
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Elevated structure needed to keep terrace usable for residents."
                      value={proposalFormData.notes}
                      onChange={(e) => setProposalFormData({ ...proposalFormData, notes: e.target.value })}
                      className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmittingProposal}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl text-xs sm:text-sm flex items-center justify-center space-x-2 transition shadow-md shadow-teal-600/20 disabled:opacity-50"
                  >
                    {isSubmittingProposal ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Submit & Forward to Verified EPCs</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* CAMPAIGN SIGNUP MODAL */}
      {showCampaignModal && selectedCampaign && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative my-8">
            <button
              onClick={() => {
                setShowCampaignModal(false);
                setCampaignSuccessMsg(null);
              }}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 text-lg font-bold"
            >
              ✕
            </button>

            {campaignSuccessMsg ? (
              <div className="space-y-4 text-center py-4">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-slate-900">Campaign Registration Confirmed!</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{campaignSuccessMsg}</p>
                <button
                  onClick={() => {
                    setShowCampaignModal(false);
                    setCampaignSuccessMsg(null);
                  }}
                  className="w-full bg-navy-900 text-white font-bold py-2.5 rounded-xl text-sm"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleCampaignSignup} className="space-y-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-teal-700 px-2.5 py-0.5 rounded border border-teal-200">
                    Community Aggregation
                  </span>
                  <h3 className="text-xl font-black text-slate-900 mt-1">{selectedCampaign.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedCampaign.tagline}</p>
                </div>

                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Apartment / Residential Society Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Orchid Springs RWA, Anna Nagar"
                      value={campaignFormData.societyName}
                      onChange={(e) => setCampaignFormData({ ...campaignFormData, societyName: e.target.value })}
                      className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Society Reg. No (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. TN/CHN/2019/412"
                        value={campaignFormData.associationRegNumber}
                        onChange={(e) => setCampaignFormData({ ...campaignFormData, associationRegNumber: e.target.value })}
                        className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        City / District *
                      </label>
                      <select
                        value={campaignFormData.city}
                        onChange={(e) => setCampaignFormData({ ...campaignFormData, city: e.target.value })}
                        className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      >
                        <option value="Chennai">Chennai</option>
                        <option value="Coimbatore">Coimbatore</option>
                        <option value="Madurai">Madurai</option>
                        <option value="Trichy">Trichy</option>
                        <option value="Salem">Salem</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Secretary / President Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. K. Sundaram"
                        value={campaignFormData.secretaryName}
                        onChange={(e) => setCampaignFormData({ ...campaignFormData, secretaryName: e.target.value })}
                        className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Contact Phone *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="+91 94440 XXXXX"
                        value={campaignFormData.contactPhone}
                        onChange={(e) => setCampaignFormData({ ...campaignFormData, contactPhone: e.target.value })}
                        className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Number of Flats / Units
                      </label>
                      <input
                        type="number"
                        value={campaignFormData.numberOfUnits}
                        onChange={(e) => setCampaignFormData({ ...campaignFormData, numberOfUnits: Number(e.target.value) })}
                        className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Common Load (kW approx)
                      </label>
                      <input
                        type="number"
                        value={campaignFormData.estimatedCommonAreaLoadKw}
                        onChange={(e) => setCampaignFormData({ ...campaignFormData, estimatedCommonAreaLoadKw: Number(e.target.value) })}
                        className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmittingCampaign}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl text-xs sm:text-sm flex items-center justify-center space-x-2 transition shadow-md shadow-teal-600/20 disabled:opacity-50"
                  >
                    {isSubmittingCampaign ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Register Society for 15% Group Discount</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
