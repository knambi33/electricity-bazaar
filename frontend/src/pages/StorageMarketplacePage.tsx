import React, { useState, useEffect } from 'react';
import { 
  BatteryCharging, 
  Cpu, 
  ArrowRight, 
  ShieldCheck, 
  Clock, 
  Zap, 
  Layers, 
  CheckCircle2, 
  HelpCircle,
  Building2
} from 'lucide-react';
import { api } from '../services/api';
import { MarketplaceListing } from '../types';

interface StoragePageProps {
  onSelectListing: (listingId: string) => void;
  setCurrentView: (view: string) => void;
}

export const StorageMarketplacePage: React.FC<StoragePageProps> = ({ onSelectListing, setCurrentView }) => {
  const [storageListings, setStorageListings] = useState<MarketplaceListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubtype, setSelectedSubtype] = useState<'ALL' | 'BATTERY_STORAGE' | 'PUMPED_HYDRO_STORAGE'>('ALL');

  useEffect(() => {
    async function loadStorage() {
      setIsLoading(true);
      try {
        const [bessRes, pspRes] = await Promise.all([
          api.getListings({ category: 'BATTERY_STORAGE' }),
          api.getListings({ category: 'PUMPED_HYDRO_STORAGE' })
        ]);

        const combined = [...(bessRes.data || []), ...(pspRes.data || [])];
        setStorageListings(combined);
      } catch (err) {
        console.error("Storage fetch error", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadStorage();
  }, []);

  const filtered = selectedSubtype === 'ALL'
    ? storageListings
    : storageListings.filter(l => l.category === selectedSubtype);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-teal-600 uppercase tracking-wider mb-1">
          <BatteryCharging className="w-4 h-4" />
          <span>Flexibility, Peak Shaving & Green RTC</span>
        </div>
        <h1 className="text-3xl font-extrabold text-navy-900 brand-font">
          Energy Storage Systems (BESS & Pumped Hydro)
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">
          Storage is essential to bridge solar generation bell curves with industrial evening peak demand. Discover grid-scale Battery Energy Storage Systems (BESS) and Pumped Storage Hydro (PSP) with transparent Power (MW) and Energy (MWh) metrics.
        </p>
      </div>

      {/* Subtype Filter Tabs */}
      <div className="flex space-x-2">
        {[
          { id: 'ALL', label: 'All Storage Technologies' },
          { id: 'BATTERY_STORAGE', label: 'Battery Storage (BESS Li-ion)' },
          { id: 'PUMPED_HYDRO_STORAGE', label: 'Pumped Hydro Storage (PSP)' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedSubtype(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              selectedSubtype === tab.id
                ? 'bg-navy-900 text-teal-300 shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Storage Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-slate-100 rounded-2xl animate-pulse"></div>
          <div className="h-64 bg-slate-100 rounded-2xl animate-pulse"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <BatteryCharging className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-700">No Storage Listings in Selected Filter</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map(listing => (
            <div
              key={listing.id}
              onClick={() => onSelectListing(listing.id)}
              className="bg-white rounded-2xl border border-slate-200 hover:border-teal-500 hover:shadow-xl transition-all cursor-pointer p-6 flex flex-col justify-between group space-y-5"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded uppercase">
                    DEMO DATA
                  </span>
                  <span className="text-[11px] font-mono font-bold text-slate-400">
                    {listing.listingCode}
                  </span>
                  <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded border border-teal-200 flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                    <span>{listing.organisation.verificationStatus.replace(/_/g, ' ')}</span>
                  </span>
                </div>

                <h3 className="text-lg font-bold text-navy-900 group-hover:text-teal-600 transition brand-font line-clamp-2">
                  {listing.title}
                </h3>

                <div className="mt-2 text-xs text-slate-500 space-y-1">
                  <div>Developer: <strong className="text-slate-800">{listing.organisation.legalName}</strong></div>
                  <div>Location: <strong className="text-slate-800">{listing.projectLocation}</strong></div>
                  <div>Grid: <strong className="text-slate-800">{listing.interconnectionType.replace(/_/g, ' ')}</strong></div>
                </div>

                {/* Storage Technical Specification Grid */}
                {listing.storageDetails && (
                  <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                    <div className="bg-slate-50 p-2.5 rounded-xl">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Power</span>
                      <span className="font-extrabold text-navy-900">{listing.storageDetails.powerCapacityMw} MW</span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Storage</span>
                      <span className="font-extrabold text-teal-700">{listing.storageDetails.energyCapacityMwh} MWh</span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Duration</span>
                      <span className="font-bold text-slate-800">{listing.storageDetails.durationHours} Hours</span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">RTE</span>
                      <span className="font-bold text-teal-700">{listing.storageDetails.roundTripEfficiencyPct || 85}%</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Service Pricing</span>
                  <span className="font-extrabold text-navy-900 text-sm">
                    {listing.indicativePricePerKwh ? `₹${listing.indicativePricePerKwh.toFixed(2)}/kWh` : 'Tolling / Capacity Fee'}
                  </span>
                </div>
                <button className="bg-navy-900 group-hover:bg-teal-600 text-white group-hover:text-navy-900 font-bold px-4 py-2 rounded-xl text-xs transition flex items-center space-x-1">
                  <span>View Technical Specs</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
