import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Search, 
  ArrowRight, 
  ShieldCheck, 
  TrendingDown, 
  Sliders, 
  Sun, 
  Wind, 
  BatteryCharging, 
  Cpu, 
  Building2, 
  Home,
  FileCheck,
  CheckCircle2,
  Calendar,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';
import { MarketplaceListing, TenderOpportunity } from '../types';

interface HomePageProps {
  setCurrentView: (view: string) => void;
  onSelectListing: (listingId: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ setCurrentView, onSelectListing }) => {
  const [featuredListings, setFeaturedListings] = useState<MarketplaceListing[]>([]);
  const [recentTenders, setRecentTenders] = useState<TenderOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Quick Search Bar state
  const [searchCategory, setSearchCategory] = useState('');
  const [searchState, setSearchState] = useState('');
  const [searchCapacityMw, setSearchCapacityMw] = useState('');
  const [searchCommercialModel, setSearchCommercialModel] = useState('');

  // Newsletter / Callback form
  const [leadEmail, setLeadEmail] = useState('');
  const [leadSubmitted, setLeadSubmitted] = useState(false);

  useEffect(() => {
    async function loadHomeData() {
      try {
        const [listingsRes, tendersRes] = await Promise.all([
          api.getListings({ limit: '6' }),
          api.getTenders()
        ]);
        setFeaturedListings(listingsRes.data || []);
        setRecentTenders((tendersRes || []).slice(0, 3));
      } catch (err) {
        console.error("Home data load error", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadHomeData();
  }, []);

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentView('marketplace');
  };

  const handleLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (leadEmail) {
      setLeadSubmitted(true);
      setLeadEmail('');
    }
  };

  return (
    <div className="space-y-16 pb-16">
      {/* ============================================================
          1. HERO SECTION & QUICK SEARCH
      ============================================================ */}
      <section className="relative bg-gradient-to-b from-navy-900 via-navy-800 to-navy-900 text-white pt-16 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Subtle grid background */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10B981_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center space-x-2 bg-teal-500/10 border border-teal-500/30 text-teal-300 px-4 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span>India's Dedicated B2B Electricity Marketplace</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight brand-font text-white leading-tight">
              Discover Better Electricity <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-300">Procurement</span> Opportunities.
            </h1>

            <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              Connect directly with verified renewable developers, captive generators, and battery storage providers. Deconstruct your utility bill, simulate statutory landed costs, and connect with confidence.
            </p>

            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <button
                onClick={() => setCurrentView('wizard')}
                className="bg-teal-500 hover:bg-teal-400 text-navy-900 font-bold px-6 py-3 rounded-xl text-sm flex items-center space-x-2 transition shadow-lg shadow-teal-500/20"
              >
                <span>Run Bill-to-Procurement Wizard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentView('marketplace')}
                className="bg-slate-800 hover:bg-slate-700 text-white font-semibold px-6 py-3 rounded-xl text-sm border border-slate-700 transition"
              >
                Explore Marketplace
              </button>
              <button
                onClick={() => setCurrentView('sell-power')}
                className="bg-transparent hover:bg-slate-800/80 text-teal-300 font-semibold px-5 py-3 rounded-xl text-sm border border-teal-500/40 transition"
              >
                List Your Offering
              </button>
            </div>
          </div>

          {/* Quick Search Panel */}
          <div className="mt-12 max-w-5xl mx-auto bg-white rounded-2xl p-4 sm:p-6 shadow-2xl text-slate-800 border border-slate-100">
            <form onSubmit={handleQuickSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Category
                </label>
                <select
                  value={searchCategory}
                  onChange={(e) => setSearchCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="">All Categories</option>
                  <option value="SOLAR_POWER">Solar Power</option>
                  <option value="WIND_POWER">Wind Power</option>
                  <option value="HYBRID_RENEWABLE">Hybrid Renewable</option>
                  <option value="RTC_FIRM_POWER">RTC Firm Power</option>
                  <option value="GROUP_CAPTIVE">Group Captive</option>
                  <option value="BATTERY_STORAGE">Battery Storage (BESS)</option>
                  <option value="PUMPED_HYDRO_STORAGE">Pumped Hydro (PSP)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  State / Grid
                </label>
                <select
                  value={searchState}
                  onChange={(e) => setSearchState(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="">All States</option>
                  <option value="Tamil Nadu">Tamil Nadu (TNERC) — Pilot</option>
                  <option value="Telangana">Telangana (TSERC) — Pilot</option>
                  <option value="Gujarat">Gujarat (GERC)</option>
                  <option value="Rajasthan">Rajasthan (RERC)</option>
                  <option value="Maharashtra">Maharashtra (MERC)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Required Capacity
                </label>
                <select
                  value={searchCapacityMw}
                  onChange={(e) => setSearchCapacityMw(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="">Any Capacity</option>
                  <option value="1">1 - 5 MW (C&I HT)</option>
                  <option value="5">5 - 15 MW (Mid Industrial)</option>
                  <option value="15">15 - 50 MW (Large Scale)</option>
                  <option value="50">50+ MW (Heavy EHT)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Commercial Model
                </label>
                <select
                  value={searchCommercialModel}
                  onChange={(e) => setSearchCommercialModel(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="">Any Model</option>
                  <option value="GROUP_CAPTIVE">Group Captive (0 CSS)</option>
                  <option value="THIRD_PARTY_OPEN_ACCESS">Third-Party Open Access</option>
                  <option value="ENERGY_STORAGE_SERVICE_AGREEMENT">Storage Service (ESSA)</option>
                  <option value="CAPEX_SALE">Turnkey Capex</option>
                </select>
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full bg-navy-900 hover:bg-navy-800 text-teal-400 font-bold p-2.5 rounded-lg text-xs flex items-center justify-center space-x-1.5 transition"
                >
                  <Search className="w-4 h-4" />
                  <span>Search Listings</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* ============================================================
          2. THE 4-STAGE PROCUREMENT JOURNEY TEASER
      ============================================================ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-navy-900 to-navy-800 rounded-3xl p-8 sm:p-12 text-white shadow-xl">
          <div className="max-w-2xl mb-8">
            <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">Strategic Framework</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold mt-1 text-white brand-font">
              How Industrial Buyers Procure on Electricity Bazaar
            </h2>
            <p className="text-slate-300 text-sm mt-2 leading-relaxed">
              We bridge the gap between landed-cost math and actionable generator inventory:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-navy-800/80 border border-slate-700/80 rounded-2xl p-5 hover:border-teal-500 transition">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-sm mb-3">
                1
              </div>
              <h3 className="font-bold text-sm text-white mb-1">Decompose Utility Bill</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Input your current HT energy charges, demand charges, and electricity duty to extract your true landed cost per unit.
              </p>
            </div>

            <div className="bg-navy-800/80 border border-slate-700/80 rounded-2xl p-5 hover:border-teal-500 transition">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-sm mb-3">
                2
              </div>
              <h3 className="font-bold text-sm text-white mb-1">Calculate Landed Economics</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Automatically apply state SERC regulations (CSS, AS, wheeling, losses) to simulate Group Captive vs. Third-Party OA savings.
              </p>
            </div>

            <div className="bg-navy-800/80 border border-slate-700/80 rounded-2xl p-5 hover:border-teal-500 transition">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-sm mb-3">
                3
              </div>
              <h3 className="font-bold text-sm text-white mb-1">Match Verified Suppliers</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Deterministic matching scores active Solar, Wind, and RTC generation capacity matching your voltage and state grid.
              </p>
            </div>

            <div className="bg-navy-800/80 border border-slate-700/80 rounded-2xl p-5 hover:border-teal-500 transition">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-sm mb-3">
                4
              </div>
              <h3 className="font-bold text-sm text-white mb-1">Compare & Connect</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Side-by-side comparison of up to 5 offers with standardized terms and private, consent-gated enquiries.
              </p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-700 flex flex-wrap items-center justify-between gap-4">
            <span className="text-xs text-slate-300">
              Pilot customers in <strong>Tamil Nadu (TANGEDCO)</strong> & <strong>Telangana (TSSPDCL)</strong> can access pre-loaded tariff schedules.
            </span>
            <button
              onClick={() => setCurrentView('wizard')}
              className="bg-teal-500 hover:bg-teal-400 text-navy-900 font-bold px-5 py-2.5 rounded-xl text-xs flex items-center space-x-2 transition"
            >
              <span>Launch Bill Wizard Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ============================================================
          NEW: ROOFTOP SOLAR & APARTMENT RWA HUB (TAMIL NADU PILOT)
      ============================================================ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-amber-500/10 via-teal-500/10 to-sky-500/10 rounded-3xl p-8 sm:p-10 border border-amber-500/30 shadow-md">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center space-x-2 bg-amber-500/20 text-amber-900 border border-amber-500/40 text-xs font-bold px-3 py-1 rounded-full">
                <Sun className="w-3.5 h-3.5 text-amber-600 animate-spin" style={{ animationDuration: '10s' }} />
                <span>Tamil Nadu Pilot Launch: Rooftop Solar & RWA Aggregation Hub</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-950 brand-font">
                Rooftop Solar for Homes, Apartments & Residents Welfare Associations (RWAs)
              </h2>
              <p className="text-slate-700 text-sm leading-relaxed">
                Unlock central subsidies up to <strong className="text-slate-900">₹78,000 for independent homes</strong> and <strong className="text-slate-900">₹18,000 / kW for Apartment Associations (RWAs)</strong> under PM Surya Ghar. Connect directly with empanelled TANGEDCO EPC contractors across Coimbatore, Chennai, Madurai, Trichy, and Salem.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">PM Surya Ghar</span>
                  <span className="font-extrabold text-amber-700">₹78,000 Direct DBT</span>
                </div>
                <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Apartment RWAs</span>
                  <span className="font-extrabold text-teal-700">₹18,000 / kW Subsidy</span>
                </div>
                <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Average Payback</span>
                  <span className="font-extrabold text-sky-700">3.2 - 3.8 Years</span>
                </div>
                <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Community Deals</span>
                  <span className="font-extrabold text-emerald-700">15% Group Discount</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col space-y-2.5 sm:w-auto w-full">
              <button
                onClick={() => setCurrentView('rooftop')}
                className="bg-navy-900 hover:bg-navy-800 text-white font-bold px-6 py-3.5 rounded-xl text-xs flex items-center justify-center space-x-2 transition shadow-md"
              >
                <Sun className="w-4 h-4 text-amber-400" />
                <span>Calculate Rooftop Savings & Subsidy</span>
                <ArrowRight className="w-4 h-4 text-slate-300" />
              </button>
              <button
                onClick={() => setCurrentView('rooftop')}
                className="bg-white hover:bg-slate-50 text-slate-800 font-semibold px-6 py-3 rounded-xl text-xs text-center border border-slate-300 transition"
              >
                <span>View Empanelled TN EPC Contractors</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          3. FEATURED ELECTRICITY & RE OPPORTUNITIES
      ============================================================ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-teal-600 uppercase tracking-wider mb-1">
              <Zap className="w-4 h-4" />
              <span>Live Capacity Pipeline</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-900 brand-font">
              Featured Power & Renewable Opportunities
            </h2>
          </div>
          <button
            onClick={() => setCurrentView('marketplace')}
            className="mt-3 sm:mt-0 text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center space-x-1"
          >
            <span>View All Listings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-slate-100 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredListings.map((listing) => (
              <div
                key={listing.id}
                onClick={() => onSelectListing(listing.id)}
                className="bg-white rounded-2xl border border-slate-200 hover:border-teal-500 hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-6">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded uppercase">
                      DEMO DATA
                    </span>
                    <span className="text-[11px] font-mono font-bold text-slate-500">
                      {listing.listingCode}
                    </span>
                    <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded flex items-center space-x-1">
                      <ShieldCheck className="w-3 h-3 text-teal-600" />
                      <span>{listing.organisation.verificationStatus.replace(/_/g, ' ')}</span>
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-navy-900 group-hover:text-teal-600 transition brand-font line-clamp-2">
                    {listing.title}
                  </h3>

                  <div className="mt-2 text-xs text-slate-500 space-y-1">
                    <div>Supplier: <strong className="text-slate-800">{listing.organisation.legalName}</strong></div>
                    <div>Location: <strong className="text-slate-800">{listing.projectLocation}</strong></div>
                    <div>Structure: <strong className="text-slate-800">{listing.commercialModel.replace(/_/g, ' ')}</strong></div>
                  </div>

                  {/* Capacity & Price pill */}
                  <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Available / Total</span>
                      <span className="font-extrabold text-navy-900 text-sm">
                        {listing.availableCapacityMw} MW <span className="font-normal text-slate-400 text-xs">/ {listing.totalCapacityMw} MW</span>
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Indicative Tariff</span>
                      <span className="font-extrabold text-teal-600 text-sm">
                        {listing.indicativePricePerKwh ? `₹${listing.indicativePricePerKwh.toFixed(2)}/kWh` : 'Inquire'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <span>Grid: <strong>{listing.interconnectionType.replace(/_/g, ' ')}</strong></span>
                  <span className="text-teal-700 font-bold group-hover:translate-x-1 transition flex items-center">
                    <span>Inspect</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ============================================================
          4. STORAGE & BESS HIGHLIGHT
      ============================================================ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-tr from-slate-900 to-navy-900 text-white rounded-3xl p-8 sm:p-10 shadow-lg border border-slate-800 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center space-x-2 bg-teal-500/20 text-teal-300 text-xs font-bold px-3 py-1 rounded-full">
              <BatteryCharging className="w-4 h-4 text-teal-400" />
              <span>Energy Storage & Peak Shaving</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold brand-font text-white">
              Battery Storage (BESS) & Pumped Hydro (PSP) Marketplace
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Transition from intermittent solar/wind to firm, dispatchable clean energy. Discover grid-scale battery systems and pumped hydro projects with distinct Power (MW) and Energy (MWh) metrics.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="bg-navy-800/80 p-3 rounded-xl border border-slate-700">
                <span className="text-slate-400 block text-[10px]">Active Technology</span>
                <span className="font-bold text-teal-300">LFP Battery Storage</span>
              </div>
              <div className="bg-navy-800/80 p-3 rounded-xl border border-slate-700">
                <span className="text-slate-400 block text-[10px]">Long-Duration</span>
                <span className="font-bold text-teal-300">Closed-Loop PSP</span>
              </div>
              <div className="bg-navy-800/80 p-3 rounded-xl border border-slate-700">
                <span className="text-slate-400 block text-[10px]">Commercial Model</span>
                <span className="font-bold text-teal-300">Capacity & ESSA</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col space-y-3 sm:w-auto w-full">
            <button
              onClick={() => setCurrentView('storage')}
              className="bg-teal-500 hover:bg-teal-400 text-navy-900 font-bold px-6 py-3.5 rounded-xl text-xs flex items-center justify-center space-x-2 transition shadow-md"
            >
              <BatteryCharging className="w-4 h-4" />
              <span>Explore Storage Marketplace</span>
            </button>
            <button
              onClick={() => setCurrentView('calculator')}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-6 py-3 rounded-xl text-xs text-center border border-slate-700 transition"
            >
              Model Storage Arbitrage Economics
            </button>
          </div>
        </div>
      </section>

      {/* ============================================================
          5. LATEST TENDERS PREVIEW
      ============================================================ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8">
          <div>
            <span className="text-xs font-bold text-teal-600 uppercase tracking-wider block mb-1">
              Public Procurement
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-900 brand-font">
              Latest Power & Energy Tenders
            </h2>
          </div>
          <button
            onClick={() => setCurrentView('tenders')}
            className="mt-3 sm:mt-0 text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center space-x-1"
          >
            <span>All Tender Notices</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recentTenders.map((tender) => (
            <div
              key={tender.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-slate-300 transition flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                  <span>{tender.tenderRefNo}</span>
                  <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold uppercase">
                    DEMO DATA
                  </span>
                </div>
                <h4 className="text-sm font-bold text-navy-900 line-clamp-2 brand-font">
                  {tender.title}
                </h4>
                <div className="text-xs text-slate-500">
                  Authority: <strong className="text-slate-800">{tender.issuingAuthority}</strong>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-1 text-slate-500">
                  <Calendar className="w-3.5 h-3.5 text-teal-600" />
                  <span>Due: {new Date(tender.submissionDeadline).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}</span>
                </div>
                <a
                  href={tender.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-700 hover:text-teal-900 font-bold flex items-center space-x-1"
                >
                  <span>Source</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================
          6. NEWSLETTER & ADVISORY CALL-BACK
      ============================================================ */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-teal-50 border border-teal-200 rounded-3xl p-8 sm:p-10 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center mx-auto shadow-md shadow-teal-500/20">
            <Zap className="w-6 h-6 fill-current" />
          </div>
          <h3 className="text-2xl font-bold text-navy-900 brand-font">
            Need Expert Assistance with Open Access or Group Captive?
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
            Our power sector advisory partners help C&I electricity consumers in <strong>Tamil Nadu</strong> and <strong>Telangana</strong> navigate DISCOM applications, CEIG approvals, and SPV equity agreements.
          </p>

          {leadSubmitted ? (
            <div className="p-4 bg-teal-100 text-teal-900 rounded-xl text-xs font-bold max-w-md mx-auto flex items-center justify-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
              <span>Thank you! An energy procurement advisor will reach out to you within 24 hours.</span>
            </div>
          ) : (
            <form onSubmit={handleLeadSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto pt-2">
              <input
                type="email"
                required
                value={leadEmail}
                onChange={(e) => setLeadEmail(e.target.value)}
                placeholder="Enter corporate email address"
                className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
              <button
                type="submit"
                className="bg-navy-900 hover:bg-navy-800 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition"
              >
                Request Advisory Contact
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
};
