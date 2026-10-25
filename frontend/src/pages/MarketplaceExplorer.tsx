import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  ArrowRight, 
  ShieldCheck, 
  Building2, 
  Sliders, 
  CheckCircle2, 
  Layers, 
  X,
  Share2,
  Bookmark,
  RefreshCw,
  Sun,
  Wind,
  BatteryCharging,
  Zap,
  MapPin,
  Lock,
  Compass
} from 'lucide-react';
import { api } from '../services/api';
import { MarketplaceListing } from '../types';
import { IndiaPowerMap } from '../components/IndiaPowerMap';

interface MarketplaceExplorerProps {
  onSelectListing: (listingId: string) => void;
  setCurrentView: (view: string) => void;
}

export const MarketplaceExplorer: React.FC<MarketplaceExplorerProps> = ({ onSelectListing, setCurrentView }) => {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showPowerMap, setShowPowerMap] = useState(true);

  // Filters
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>('ALL');
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedCommercialModel, setSelectedCommercialModel] = useState<string>('');
  const [selectedInterconnection, setSelectedInterconnection] = useState<string>('');
  const [minCapacityMw, setMinCapacityMw] = useState<string>('');
  const [maxCapacityMw, setMaxCapacityMw] = useState<string>('');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('RECENT');

  // Comparison drawer state
  const [comparisonList, setComparisonList] = useState<MarketplaceListing[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [shareCopied, setShareCopied] = useState(false);

  const categoryTabs = [
    { id: 'ALL', label: 'All Opportunities' },
    { id: 'SUBSTATION_BAY', label: '⚡ Evacuation Bays (33/110/132/230 kV)' },
    { id: 'LAND_PARCEL', label: '🏞 Land Parcels & Parks' },
    { id: 'SOLAR_POWER', label: 'Solar Power' },
    { id: 'WIND_POWER', label: 'Wind Power' },
    { id: 'HYBRID_RENEWABLE', label: 'Hybrid Renewable' },
    { id: 'RTC_FIRM_POWER', label: 'RTC & Firm Clean Power' },
    { id: 'GROUP_CAPTIVE', label: 'Group Captive' },
    { id: 'BATTERY_STORAGE', label: 'Battery Storage (BESS)' },
    { id: 'PUMPED_HYDRO_STORAGE', label: 'Pumped Hydro (PSP)' },
    { id: 'OPEN_ACCESS_SHORT_TERM', label: 'Short-Term Open Access' },
    { id: 'SOLAR_EPC', label: 'Solar EPC' },
    { id: 'POWER_CONSULTANCY', label: 'Power Advisory' },
  ];

  const fetchListings = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {
        page: currentPage.toString(),
        limit: '9',
        sort: sortBy
      };

      if (activeCategoryTab !== 'ALL') {
        params.category = activeCategoryTab;
      }
      if (selectedState) params.state = selectedState;
      if (selectedCommercialModel) params.commercialModel = selectedCommercialModel;
      if (selectedInterconnection) params.interconnectionType = selectedInterconnection;
      if (minCapacityMw) params.minCapacityMw = minCapacityMw;
      if (maxCapacityMw) params.maxCapacityMw = maxCapacityMw;
      if (searchKeyword.trim()) params.search = searchKeyword.trim();

      const res = await api.getListings(params);
      setListings(res.data);
      setTotalCount(res.meta.totalCount || res.data.length);
      setTotalPages(res.meta.totalPages || 1);
    } catch (err) {
      console.error("Listings fetch error", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [activeCategoryTab, selectedState, selectedCommercialModel, selectedInterconnection, sortBy, currentPage]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchListings();
  };

  const toggleComparison = (listing: MarketplaceListing) => {
    if (comparisonList.some(item => item.id === listing.id)) {
      setComparisonList(comparisonList.filter(item => item.id !== listing.id));
    } else {
      if (comparisonList.length >= 5) {
        alert("You can compare up to 5 opportunities side by side.");
        return;
      }
      setComparisonList([...comparisonList, listing]);
    }
  };

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (bookmarkedIds.includes(id)) {
      setBookmarkedIds(bookmarkedIds.filter(bId => bId !== id));
    } else {
      setBookmarkedIds([...bookmarkedIds, id]);
    }
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Title & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-teal-600 uppercase tracking-wider mb-1">
            <Zap className="w-3.5 h-3.5" />
            <span>Open Energy Sourcing & Infrastructure</span>
          </div>
          <h1 className="text-3xl font-extrabold text-navy-900 brand-font">Marketplace Explorer</h1>
          <p className="text-xs text-slate-500 mt-1">
            Discover verified solar, wind, hybrid, battery storage, <strong>substation evacuation bays</strong>, and <strong>land parks</strong> across Tamil Nadu, Telangana, Puducherry & India.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowPowerMap(!showPowerMap)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm border ${
              showPowerMap 
                ? 'bg-navy-900 text-teal-300 border-navy-800' 
                : 'bg-white text-navy-900 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-teal-400" />
            <span>{showPowerMap ? 'Hide Power Map' : '🗺️ View India Power Map'}</span>
          </button>
          <button
            onClick={() => setCurrentView('wizard')}
            className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
          >
            <span>★ Bill Diagnostic Wizard</span>
          </button>
          <button
            onClick={handleShare}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-1"
            title="Share search link"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{shareCopied ? 'Link Copied!' : 'Share'}</span>
          </button>
        </div>
      </div>

      {/* Interactive India Power Map Section */}
      {showPowerMap && (
        <div className="transition-all duration-300">
          <IndiaPowerMap
            selectedState={selectedState}
            onSelectState={(state) => {
              setSelectedState(state);
              setCurrentPage(1);
            }}
            setCurrentView={setCurrentView}
          />
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-thin">
        {categoryTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveCategoryTab(tab.id);
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeCategoryTab === tab.id
                ? 'bg-navy-900 text-white shadow-md'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content Layout: Filters Sidebar + Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Filter Sidebar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-navy-900 flex items-center space-x-1.5">
              <Filter className="w-3.5 h-3.5 text-teal-600" />
              <span>Filters</span>
            </span>
            <button
              onClick={() => {
                setSelectedState('');
                setSelectedCommercialModel('');
                setSelectedInterconnection('');
                setMinCapacityMw('');
                setMaxCapacityMw('');
                setSearchKeyword('');
                setSortBy('RECENT');
              }}
              className="text-[11px] text-teal-700 hover:underline font-semibold"
            >
              Reset
            </button>
          </div>

          {/* Search Keyword */}
          <form onSubmit={handleSearchSubmit}>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Keyword Search
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Title, bay, park, developer..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </form>

          {/* State / Grid Jurisdiction */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              State / SERC Jurisdiction
            </label>
            <select
              value={selectedState}
              onChange={(e) => { setSelectedState(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              <option value="">All Indian States & UTs</option>
              <option value="Tamil Nadu">Tamil Nadu (TNERC) — Pilot</option>
              <option value="Telangana">Telangana (TSERC) — Pilot</option>
              <option value="Puducherry">Puducherry (JERC / PED) — Pilot</option>
              <option value="Gujarat">Gujarat (GERC)</option>
              <option value="Rajasthan">Rajasthan (RERC)</option>
              <option value="Maharashtra">Maharashtra (MERC)</option>
              <option value="Karnataka">Karnataka (KERC)</option>
              <option value="Andhra Pradesh">Andhra Pradesh (APERC)</option>
              <option value="Madhya Pradesh">Madhya Pradesh (MPERC)</option>
            </select>
          </div>

          {/* Commercial Model */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Commercial Structure
            </label>
            <select
              value={selectedCommercialModel}
              onChange={(e) => { setSelectedCommercialModel(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              <option value="">All Structures</option>
              <option value="GROUP_CAPTIVE">Group Captive (26% Eq / 0 CSS)</option>
              <option value="THIRD_PARTY_OPEN_ACCESS">Third-Party Open Access</option>
              <option value="ENERGY_STORAGE_SERVICE_AGREEMENT">Energy Storage (ESSA)</option>
              <option value="CAPEX_SALE">Turnkey Capex / Land Lease</option>
            </select>
          </div>

          {/* Interconnection Grid */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Interconnection Level
            </label>
            <select
              value={selectedInterconnection}
              onChange={(e) => { setSelectedInterconnection(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              <option value="">Any Interconnection</option>
              <option value="STU_INTRA_STATE">STU Intra-State Grid (TANTRANSCO / TSTRANSCO / PED)</option>
              <option value="CTU_INTER_STATE">CTU Inter-State Grid (POWERGRID)</option>
            </select>
          </div>

          {/* Capacity Range */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Available Capacity (MW)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Min MW"
                value={minCapacityMw}
                onChange={(e) => setMinCapacityMw(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
              <input
                type="number"
                placeholder="Max MW"
                value={maxCapacityMw}
                onChange={(e) => setMaxCapacityMw(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
            <button
              onClick={() => { setCurrentPage(1); fetchListings(); }}
              className="mt-2 w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 rounded-lg text-xs font-semibold"
            >
              Apply Capacity Filter
            </button>
          </div>
        </div>

        {/* Listings Grid */}
        <div id="marketplace-listings-grid" className="lg:col-span-3 space-y-4">
          {/* Top Sort & Count Bar */}
          <div className="bg-white rounded-xl border border-slate-200 px-4 py-2.5 flex flex-wrap justify-between items-center text-xs">
            <span className="text-slate-600 font-medium">
              Showing <strong>{listings.length}</strong> of <strong>{totalCount}</strong> published opportunities {selectedState && <span className="text-teal-600 font-bold">in {selectedState}</span>}
            </span>
            <div className="flex items-center space-x-2">
              <span className="text-slate-500">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 focus:outline-none"
              >
                <option value="RECENT">Recently Listed</option>
                <option value="CAPACITY_DESC">Capacity: High to Low</option>
                <option value="CAPACITY_ASC">Capacity: Low to High</option>
                <option value="PRICE_ASC">Tariff: Low to High</option>
                <option value="VIEWS_DESC">Most Viewed</option>
              </select>
            </div>
          </div>

          {/* Cards */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-64 bg-slate-100 rounded-2xl animate-pulse"></div>
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <Zap className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-navy-900">No Listings Match Your Filters</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try widening your capacity limits, clearing state filters, or switching to "All Opportunities".
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings.map(listing => {
                const isCompared = comparisonList.some(item => item.id === listing.id);
                const isBookmarked = bookmarkedIds.includes(listing.id);
                const isBay = listing.category === 'SUBSTATION_BAY';
                const isLand = listing.category === 'LAND_PARCEL';

                return (
                  <div
                    key={listing.id}
                    onClick={() => onSelectListing(listing.id)}
                    className="bg-white rounded-2xl border border-slate-200 hover:border-teal-500 hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between overflow-hidden group relative"
                  >
                    <div className="p-5">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                          <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded uppercase">
                            DEMO
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {listing.listingCode}
                          </span>
                          {listing.isConfidential && (
                            <span className="text-[9px] font-bold bg-slate-900 text-teal-300 px-1.5 py-0.5 rounded flex items-center space-x-1 border border-slate-700">
                              <Lock className="w-2.5 h-2.5 text-teal-400" />
                              <span>NDA</span>
                            </span>
                          )}
                          {isBay && (
                            <span className="text-[9px] font-bold bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded uppercase">
                              EVACUATION BAY
                            </span>
                          )}
                          {isLand && (
                            <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded uppercase">
                              RE LAND
                            </span>
                          )}
                        </div>
                        <button
                          onClick={(e) => toggleBookmark(listing.id, e)}
                          className={`p-1 rounded transition ${isBookmarked ? 'text-amber-500' : 'text-slate-300 hover:text-slate-500'}`}
                        >
                          <Bookmark className="w-4 h-4 fill-current" />
                        </button>
                      </div>

                      <h3 className="text-sm font-bold text-navy-900 group-hover:text-teal-600 transition brand-font line-clamp-2">
                        {listing.title}
                      </h3>

                      <div className="mt-2 text-[11px] text-slate-500 space-y-0.5">
                        <div className="truncate">Supplier: <strong className="text-slate-800">{listing.organisation.legalName}</strong></div>
                        <div className="truncate">State: <strong className="text-slate-800">{listing.state}</strong> ({listing.interconnectionType.replace(/_/g, ' ')})</div>
                        <div className="truncate">Model: <strong className="text-slate-800">{listing.commercialModel.replace(/_/g, ' ')}</strong></div>
                      </div>

                      {/* Capacity & Price pill */}
                      <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase font-bold">
                            {isLand ? 'Land Bank' : isBay ? 'Bay Capacity' : 'Available'}
                          </span>
                          <span className="font-extrabold text-navy-900 text-sm">
                            {isLand 
                              ? `${listing.landAreaAcres || listing.availableCapacityMw * 4} Acres`
                              : isBay 
                              ? `${listing.bayCapacityMw || listing.availableCapacityMw} MW`
                              : `${listing.availableCapacityMw} MW`
                            }
                          </span>
                          {isBay && listing.substationVoltageKv && (
                            <span className="block text-[10px] text-teal-700 font-bold">
                              @{listing.substationVoltageKv} kV
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-slate-400 block text-[9px] uppercase font-bold">
                            {isLand ? 'Terms' : isBay ? 'Structure' : 'PPA Tariff'}
                          </span>
                          <span className="font-extrabold text-teal-600 text-sm">
                            {isLand ? (
                              'Long Lease'
                            ) : isBay ? (
                              'Dedicated Bay'
                            ) : listing.indicativePricePerKwh ? (
                              <>
                                ₹{listing.indicativePricePerKwh.toFixed(2)}
                                <span className="text-[9px] font-normal text-slate-400">/u</span>
                              </>
                            ) : (
                              'Custom'
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleComparison(listing);
                        }}
                        className={`text-[11px] font-bold px-2 py-1 rounded transition ${
                          isCompared
                            ? 'bg-teal-600 text-white'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {isCompared ? '✓ Comparing' : '+ Compare'}
                      </button>

                      <span className="text-teal-700 font-bold group-hover:translate-x-0.5 transition flex items-center text-[11px]">
                        <span>Details</span>
                        <ArrowRight className="w-3 h-3 ml-0.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Bar */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 pt-6">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-xs text-slate-500 font-medium">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Floating Comparison Bar when items are selected */}
      {comparisonList.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-navy-900 text-white rounded-2xl shadow-2xl p-4 border border-slate-700 flex items-center space-x-4 max-w-2xl w-full mx-auto">
          <div className="flex-1">
            <div className="text-xs font-bold text-teal-400">
              {comparisonList.length} of 5 opportunities selected
            </div>
            <div className="text-[11px] text-slate-300 truncate">
              {comparisonList.map(c => c.listingCode).join(', ')}
            </div>
          </div>
          <button
            onClick={() => setCurrentView('wizard')}
            className="bg-teal-500 hover:bg-teal-400 text-navy-900 font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1 transition"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Open Side-by-Side Matrix</span>
          </button>
          <button
            onClick={() => setComparisonList([])}
            className="text-slate-400 hover:text-white p-1"
            title="Clear comparison"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
