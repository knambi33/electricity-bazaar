import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  MapPin, 
  ShieldCheck, 
  Layers, 
  ArrowRight, 
  Sliders, 
  Activity, 
  ExternalLink,
  Building2,
  ChevronRight,
  TrendingUp,
  Cpu,
  Compass
} from 'lucide-react';
import { api } from '../services/api';

export interface StatePowerInfo {
  name: string;
  code: string;
  regulator: string;
  discom: string;
  openAccessThreshold: string;
  typicalIndustrialTariff: number; // Rs/kWh
  status: 'PILOT_ACTIVE' | 'SERC_COVERED' | 'EXPANDING';
  isPilot?: boolean;
  x: number; // Coordinate percentage on SVG canvas
  y: number;
  width?: number;
  height?: number;
  svgPath?: string;
}

export const INDIAN_POWER_STATES: Record<string, StatePowerInfo> = {
  'Tamil Nadu': {
    name: 'Tamil Nadu',
    code: 'TN',
    regulator: 'TNERC (Tamil Nadu Electricity Regulatory Commission)',
    discom: 'TANGEDCO / TNPDCL (Chennai, Coimbatore, Madurai)',
    openAccessThreshold: '>= 100 kW for GEOA / >= 63 kVA HT',
    typicalIndustrialTariff: 8.75,
    status: 'PILOT_ACTIVE',
    isPilot: true,
    x: 48,
    y: 84
  },
  'Telangana': {
    name: 'Telangana',
    code: 'TG',
    regulator: 'TSERC (Telangana State Electricity Regulatory Commission)',
    discom: 'TSSPDCL / TSNPDCL (Hyderabad, Warangal)',
    openAccessThreshold: '>= 100 kW for Green Energy Open Access',
    typicalIndustrialTariff: 8.45,
    status: 'PILOT_ACTIVE',
    isPilot: true,
    x: 52,
    y: 64
  },
  'Puducherry': {
    name: 'Puducherry',
    code: 'PY',
    regulator: 'JERC (Joint Electricity Regulatory Commission for Goa & UTs)',
    discom: 'PED (Electricity Department, Govt of Puducherry)',
    openAccessThreshold: '>= 100 kW under JERC GEOA regulations',
    typicalIndustrialTariff: 7.20,
    status: 'PILOT_ACTIVE',
    isPilot: true,
    x: 62,
    y: 83
  },
  'Gujarat': {
    name: 'Gujarat',
    code: 'GJ',
    regulator: 'GERC (Gujarat Electricity Regulatory Commission)',
    discom: 'GUVNL / MGVCL / DGVCL / Torrent Power',
    openAccessThreshold: '>= 100 kW for Green Open Access',
    typicalIndustrialTariff: 8.20,
    status: 'SERC_COVERED',
    x: 23,
    y: 49
  },
  'Maharashtra': {
    name: 'Maharashtra',
    code: 'MH',
    regulator: 'MERC (Maharashtra Electricity Regulatory Commission)',
    discom: 'MSEDCL (Mahavitaran) / Adani Electricity',
    openAccessThreshold: '>= 100 kW for Green Open Access',
    typicalIndustrialTariff: 8.90,
    status: 'SERC_COVERED',
    x: 37,
    y: 60
  },
  'Rajasthan': {
    name: 'Rajasthan',
    code: 'RJ',
    regulator: 'RERC (Rajasthan Electricity Regulatory Commission)',
    discom: 'JVVNL / AVVNL / JdVVNL (Jaipur, Ajmer, Jodhpur)',
    openAccessThreshold: '>= 100 kW for Solar/Wind Open Access',
    typicalIndustrialTariff: 8.10,
    status: 'SERC_COVERED',
    x: 32,
    y: 35
  },
  'Karnataka': {
    name: 'Karnataka',
    code: 'KA',
    regulator: 'KERC (Karnataka Electricity Regulatory Commission)',
    discom: 'BESCOM / MESCOM / HESCOM / GESCOM',
    openAccessThreshold: '>= 100 kW for Green Open Access',
    typicalIndustrialTariff: 8.15,
    status: 'SERC_COVERED',
    x: 39,
    y: 77
  },
  'Andhra Pradesh': {
    name: 'Andhra Pradesh',
    code: 'AP',
    regulator: 'APERC (Andhra Pradesh Electricity Regulatory Commission)',
    discom: 'APCPDCL / APSPDCL / APEPDCL (Visakhapatnam)',
    openAccessThreshold: '>= 100 kW for Green Energy Open Access',
    typicalIndustrialTariff: 7.95,
    status: 'SERC_COVERED',
    x: 58,
    y: 73
  },
  'Madhya Pradesh': {
    name: 'Madhya Pradesh',
    code: 'MP',
    regulator: 'MPERC (Madhya Pradesh Electricity Regulatory Commission)',
    discom: 'MPPKVVCL / MPMKVVCL (Indore, Bhopal, Jabalpur)',
    openAccessThreshold: '>= 100 kW for GEOA',
    typicalIndustrialTariff: 7.80,
    status: 'SERC_COVERED',
    x: 48,
    y: 47
  },
  'Uttar Pradesh': {
    name: 'Uttar Pradesh',
    code: 'UP',
    regulator: 'UPERC (Uttar Pradesh Electricity Regulatory Commission)',
    discom: 'UPPCL / PVVNL / DVVNL / MVVNL',
    openAccessThreshold: '>= 100 kW for Green Open Access',
    typicalIndustrialTariff: 8.50,
    status: 'EXPANDING',
    x: 55,
    y: 36
  }
};

interface IndiaPowerMapProps {
  selectedState: string;
  onSelectState: (state: string) => void;
  setCurrentView?: (view: string) => void;
}

export const IndiaPowerMap: React.FC<IndiaPowerMapProps> = ({
  selectedState,
  onSelectState,
  setCurrentView
}) => {
  const [stateCounts, setStateCounts] = useState<Record<string, any>>({});
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [activeFilterCategory, setActiveFilterCategory] = useState<'ALL' | 'SUBSTATION_BAY' | 'LAND_PARCEL' | 'POWER'>('ALL');

  useEffect(() => {
    async function loadCounts() {
      try {
        const counts = await api.getStateCounts();
        setStateCounts(counts || {});
      } catch (err) {
        console.error("Failed to fetch state counts:", err);
      }
    }
    loadCounts();
  }, []);

  const activeInfo = selectedState ? INDIAN_POWER_STATES[selectedState] : null;
  const activeCountData = selectedState ? stateCounts[selectedState] : null;

  return (
    <div className="bg-gradient-to-br from-navy-950 via-slate-900 to-navy-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl border border-slate-800 relative overflow-hidden">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#0d9488_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 relative z-10">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-extrabold bg-teal-500/20 text-teal-300 border border-teal-500/30 mb-2">
            <Compass className="w-3.5 h-3.5 text-teal-400 animate-spin-slow" />
            <span>Pan-India Regulatory & Power Infrastructure Navigator</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white brand-font tracking-tight">
            Interactive India Power Grid Map
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Click any State / UT to explore operational solar/wind parks, <strong>substation evacuation bays (CTU/STU)</strong>, <strong>renewable land parcels</strong>, and SERC open access tariffs.
          </p>
        </div>

        {/* Category Filter Pills on Map */}
        <div className="flex flex-wrap gap-1.5 p-1 bg-navy-900/90 rounded-2xl border border-slate-700/80 text-xs">
          {[
            { id: 'ALL', label: 'All Assets' },
            { id: 'SUBSTATION_BAY', label: '⚡ Evacuation Bays' },
            { id: 'LAND_PARCEL', label: '🏞 Land Parcels' },
            { id: 'POWER', label: '☀️ Solar / Wind' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveFilterCategory(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl font-bold transition text-xs ${
                activeFilterCategory === tab.id
                  ? 'bg-teal-500 text-navy-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        {/* Left Column: Interactive Map Canvas */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center">
          <div className="relative w-full max-w-[540px] aspect-[4/5] bg-slate-900/60 rounded-3xl border border-slate-800 p-6 flex items-center justify-center backdrop-blur-md">
            
            {/* SVG Base Graphic for India outline */}
            <svg 
              viewBox="0 0 600 700" 
              className="w-full h-full drop-shadow-[0_10px_25px_rgba(13,148,136,0.15)]"
            >
              <defs>
                <linearGradient id="mapGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0f172a" />
                  <stop offset="50%" stopColor="#1e293b" />
                  <stop offset="100%" stopColor="#0f172a" />
                </linearGradient>
                <linearGradient id="pilotGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#14b8a6" />
                  <stop offset="100%" stopColor="#0d9488" />
                </linearGradient>
              </defs>

              {/* Stylized Geographical Sub-Regions of India */}
              {/* Northern Zone */}
              <path
                d="M 230 70 L 290 40 L 340 70 L 370 140 L 330 200 L 250 210 L 220 150 Z"
                fill="#1e293b"
                stroke="#334155"
                strokeWidth="1.5"
                className="opacity-70 hover:opacity-100 transition"
              />
              {/* Western Zone (Rajasthan & Gujarat) */}
              <path
                d="M 120 230 L 240 210 L 290 280 L 250 380 L 140 370 L 100 300 Z"
                fill="#1e293b"
                stroke="#334155"
                strokeWidth="1.5"
                className="opacity-70 hover:opacity-100 transition"
              />
              {/* Central Zone (MP & UP) */}
              <path
                d="M 250 210 L 400 210 L 440 310 L 360 380 L 270 370 Z"
                fill="#1e293b"
                stroke="#334155"
                strokeWidth="1.5"
                className="opacity-70 hover:opacity-100 transition"
              />
              {/* Eastern Zone & North-East */}
              <path
                d="M 400 210 L 530 180 L 560 250 L 470 330 L 420 310 Z"
                fill="#1e293b"
                stroke="#334155"
                strokeWidth="1.5"
                className="opacity-50"
              />
              {/* Deccan & Southern Peninsula (Maharashtra, Telangana, Karnataka, Andhra, TN, Puducherry) */}
              <path
                d="M 150 370 L 360 380 L 410 460 L 350 590 L 290 670 L 230 570 L 190 440 Z"
                fill="#0f2b38"
                stroke="#0d9488"
                strokeWidth="2"
                className="opacity-90"
              />

              {/* Major Transmission CTU Interconnection Grid Lines */}
              <path d="M 170 320 Q 300 370 320 440" stroke="#0d9488" strokeWidth="1.5" strokeDasharray="4 4" fill="none" opacity="0.6" />
              <path d="M 320 440 Q 310 520 300 600" stroke="#14b8a6" strokeWidth="2" strokeDasharray="3 3" fill="none" opacity="0.8" />
              <path d="M 320 440 L 380 500 L 360 590" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" fill="none" opacity="0.7" />
            </svg>

            {/* Interactive State Hub Pins / Node Badges */}
            {Object.entries(INDIAN_POWER_STATES).map(([stateName, info]) => {
              const countData = stateCounts[stateName];
              const count = countData ? countData.count : (info.isPilot ? 3 : 1);
              const isSelected = selectedState === stateName;
              const isHovered = hoveredState === stateName;

              return (
                <div
                  key={stateName}
                  style={{
                    position: 'absolute',
                    left: `${info.x}%`,
                    top: `${info.y}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                  onMouseEnter={() => setHoveredState(stateName)}
                  onMouseLeave={() => setHoveredState(null)}
                  onClick={() => onSelectState(isSelected ? '' : stateName)}
                  className="cursor-pointer group z-20"
                >
                  {/* Pulse halo for pilot states */}
                  {info.isPilot && (
                    <span className="absolute -inset-2 rounded-full bg-teal-400/20 animate-ping group-hover:bg-teal-400/40" />
                  )}

                  <div className={`px-2.5 py-1 rounded-xl text-xs font-black flex items-center space-x-1.5 transition-all shadow-lg backdrop-blur-md ${
                    isSelected
                      ? 'bg-amber-400 text-slate-950 scale-110 ring-4 ring-amber-400/30 shadow-amber-400/30'
                      : info.isPilot
                      ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-navy-950 group-hover:scale-110 shadow-teal-500/20 ring-2 ring-teal-300'
                      : 'bg-slate-800/90 text-slate-200 border border-slate-700 hover:border-teal-400 hover:text-white'
                  }`}>
                    <span className="text-[10px] font-mono">{info.code}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    <span className="text-[11px] font-extrabold">{count}</span>
                  </div>

                  {/* Micro Tooltip on hover */}
                  {(isHovered || isSelected) && (
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-navy-950 text-white border border-teal-500/40 px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap shadow-xl pointer-events-none z-30">
                      {stateName} {info.isPilot ? '★ Pilot' : ''} • ₹{info.typicalIndustrialTariff}/u
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center space-x-4 mt-3 text-[11px] text-slate-400">
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-400 ring-2 ring-teal-400/30 animate-pulse" />
              <strong className="text-teal-300">Active Pilot States</strong> (TN, TG, PY)
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-700 border border-slate-500" />
              <span>SERC Multi-Year Covered</span>
            </span>
          </div>
        </div>

        {/* Right Column: State Regulatory & Opportunities Intelligence Flyout */}
        <div className="lg:col-span-5 space-y-4">
          {activeInfo ? (
            <div className="bg-slate-900/90 border border-teal-500/40 rounded-3xl p-6 space-y-5 shadow-xl backdrop-blur-md animate-fade-in">
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-black text-white">{activeInfo.name}</span>
                    {activeInfo.isPilot && (
                      <span className="bg-amber-400 text-navy-950 text-[10px] font-black px-2 py-0.5 rounded-md uppercase">
                        Active Pilot
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-teal-300 font-semibold mt-0.5 block">
                    {activeInfo.regulator}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Typical HT Tariff</span>
                  <span className="text-xl font-black text-amber-400">₹{activeInfo.typicalIndustrialTariff.toFixed(2)}</span>
                  <span className="text-[10px] text-slate-400 block">/ kWh landed</span>
                </div>
              </div>

              {/* Discom & Open Access Rules */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Distribution Licensee</span>
                  <span className="font-bold text-slate-200 mt-1 block leading-snug">
                    {activeInfo.discom}
                  </span>
                </div>

                <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Open Access Threshold</span>
                  <span className="font-bold text-teal-300 mt-1 block leading-snug">
                    {activeInfo.openAccessThreshold}
                  </span>
                </div>
              </div>

              {/* Asset & Listing Metrics Breakdown */}
              <div className="bg-navy-950/80 rounded-2xl p-4 border border-slate-800 space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Available Infrastructure & Power Opportunities
                </span>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-slate-800/60 p-2.5 rounded-xl">
                    <span className="text-sm sm:text-base font-black text-teal-400 block">
                      {activeCountData?.totalCapacityMw || (activeInfo.isPilot ? 55 : 25)} MW
                    </span>
                    <span className="text-[10px] text-slate-400">Clean Power</span>
                  </div>

                  <div className="bg-slate-800/60 p-2.5 rounded-xl">
                    <span className="text-sm sm:text-base font-black text-amber-400 block">
                      {activeCountData?.bayCount || (activeInfo.isPilot ? 1 : 0)} Bay(s)
                    </span>
                    <span className="text-[10px] text-slate-400">Substation Bays</span>
                  </div>

                  <div className="bg-slate-800/60 p-2.5 rounded-xl">
                    <span className="text-sm sm:text-base font-black text-emerald-400 block">
                      {activeCountData?.landParcelCount || (activeInfo.isPilot ? 1 : 0)} Parcels
                    </span>
                    <span className="text-[10px] text-slate-400">Land Banks</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={() => onSelectState(activeInfo.name)}
                  className="w-full bg-teal-500 hover:bg-teal-400 text-navy-950 font-extrabold py-3 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 transition shadow-md shadow-teal-500/20"
                >
                  <Zap className="w-4 h-4" />
                  <span>Filter {activeInfo.name} Opportunities in Explorer</span>
                </button>

                {setCurrentView && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setCurrentView('calculator')}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition border border-slate-700"
                    >
                      <Sliders className="w-3.5 h-3.5 text-teal-400" />
                      <span>Landed Cost Calc</span>
                    </button>

                    <button
                      onClick={() => setCurrentView('wizard')}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition border border-slate-700"
                    >
                      <Activity className="w-3.5 h-3.5 text-amber-400" />
                      <span>HT Bill Diagnostic</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 text-center space-y-4 backdrop-blur-md">
              <div className="w-14 h-14 rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 mx-auto">
                <Compass className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Select a State on the Map</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
                  Click on <strong>Tamil Nadu</strong>, <strong>Telangana</strong>, or <strong>Puducherry</strong> on the interactive map to preview local substation bays, solar/wind capacity, and Discom open access rules.
                </p>
              </div>

              {/* Quick Jump Buttons */}
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {['Tamil Nadu', 'Telangana', 'Puducherry', 'Gujarat', 'Maharashtra'].map(st => (
                  <button
                    key={st}
                    onClick={() => onSelectState(st)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition border border-slate-700"
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
