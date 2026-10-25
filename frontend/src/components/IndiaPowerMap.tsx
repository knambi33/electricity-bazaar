import React, { useState, useEffect, useRef } from 'react';
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
  Compass,
  Maximize2,
  Navigation,
  CheckCircle2,
  Lock,
  Layers2
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
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
  center: [number, number]; // lat, lng
  zoom: number;
}

export const INDIAN_POWER_STATES: Record<string, StatePowerInfo> = {
  'Tamil Nadu': {
    name: 'Tamil Nadu',
    code: 'TN',
    regulator: 'TNERC (Tamil Nadu Electricity Regulatory Commission)',
    discom: 'TANGEDCO / TNPDCL (Chennai, Coimbatore, Madurai, Tirunelveli)',
    openAccessThreshold: '≥ 100 kW for GEOA / ≥ 63 kVA HT Consumer',
    typicalIndustrialTariff: 8.75,
    status: 'PILOT_ACTIVE',
    isPilot: true,
    center: [11.1271, 78.6569],
    zoom: 7
  },
  'Telangana': {
    name: 'Telangana',
    code: 'TG',
    regulator: 'TSERC (Telangana State Electricity Regulatory Commission)',
    discom: 'TSSPDCL / TSNPDCL (Hyderabad, Warangal, Mahbubnagar)',
    openAccessThreshold: '≥ 100 kW under TSERC Green Open Access 2024',
    typicalIndustrialTariff: 8.45,
    status: 'PILOT_ACTIVE',
    isPilot: true,
    center: [17.8749, 78.1008],
    zoom: 7
  },
  'Puducherry': {
    name: 'Puducherry',
    code: 'PY',
    regulator: 'JERC (Joint Electricity Regulatory Commission for Goa & UTs)',
    discom: 'PED (Electricity Department, Govt of Puducherry)',
    openAccessThreshold: '≥ 100 kW under JERC Green Energy Open Access',
    typicalIndustrialTariff: 7.20,
    status: 'PILOT_ACTIVE',
    isPilot: true,
    center: [11.9416, 79.8083],
    zoom: 11
  },
  'Gujarat': {
    name: 'Gujarat',
    code: 'GJ',
    regulator: 'GERC (Gujarat Electricity Regulatory Commission)',
    discom: 'GUVNL / DGVCL / MGVCL / PGVCL / UGVCL',
    openAccessThreshold: '≥ 100 kW under GERC GEOA Regulations',
    typicalIndustrialTariff: 7.85,
    status: 'SERC_COVERED',
    center: [22.2587, 71.1924],
    zoom: 7
  },
  'Maharashtra': {
    name: 'Maharashtra',
    code: 'MH',
    regulator: 'MERC (Maharashtra Electricity Regulatory Commission)',
    discom: 'MSEDCL (Mahavitaran) / Adani Electricity / Tata Power',
    openAccessThreshold: '≥ 100 kW for Green Open Access',
    typicalIndustrialTariff: 8.90,
    status: 'SERC_COVERED',
    center: [19.7515, 75.7139],
    zoom: 7
  },
  'Rajasthan': {
    name: 'Rajasthan',
    code: 'RJ',
    regulator: 'RERC (Rajasthan Electricity Regulatory Commission)',
    discom: 'JVVNL / AVVNL / JdVVNL (Jaipur, Ajmer, Jodhpur)',
    openAccessThreshold: '≥ 100 kW for Solar & Wind Open Access',
    typicalIndustrialTariff: 8.10,
    status: 'SERC_COVERED',
    center: [27.0238, 74.2179],
    zoom: 7
  },
  'Karnataka': {
    name: 'Karnataka',
    code: 'KA',
    regulator: 'KERC (Karnataka Electricity Regulatory Commission)',
    discom: 'BESCOM / MESCOM / HESCOM / GESCOM / CESC',
    openAccessThreshold: '≥ 100 kW for Green Open Access',
    typicalIndustrialTariff: 8.15,
    status: 'SERC_COVERED',
    center: [15.3173, 75.7139],
    zoom: 7
  },
  'Andhra Pradesh': {
    name: 'Andhra Pradesh',
    code: 'AP',
    regulator: 'APERC (Andhra Pradesh Electricity Regulatory Commission)',
    discom: 'APCPDCL / APSPDCL / APEPDCL (Visakhapatnam, Vijayawada)',
    openAccessThreshold: '≥ 100 kW under APERC GEOA Rules',
    typicalIndustrialTariff: 7.95,
    status: 'SERC_COVERED',
    center: [15.9129, 79.7400],
    zoom: 7
  }
};

interface MapMarkerItem {
  id: string;
  name: string;
  type: 'SUBSTATION_BAY' | 'LAND_PARCEL' | 'POWER' | 'REGULATOR';
  state: string;
  district: string;
  coords: [number, number];
  metric: string;
  subMetric: string;
  details: string;
  isConfidential?: boolean;
}

const MAP_MARKERS: MapMarkerItem[] = [
  // Tamil Nadu
  {
    id: 'TN-BAY-01',
    name: '40 MW Kayathar 110/33 kV Evacuation Bay',
    type: 'SUBSTATION_BAY',
    state: 'Tamil Nadu',
    district: 'Thoothukudi / Tirunelveli District',
    coords: [8.9567, 77.7719],
    metric: '40 MW @ 110/33 kV',
    subMetric: 'TANTRANSCO Grid Interconnection',
    details: 'Equipped with SF6 circuit breaker, numeric relays, and direct SLDC telemetry.',
    isConfidential: true
  },
  {
    id: 'TN-LND-02',
    name: '250 Acres Radhapuram High-Wind/Solar Land Bank',
    type: 'LAND_PARCEL',
    state: 'Tamil Nadu',
    district: 'Tirunelveli District',
    coords: [8.2673, 77.6744],
    metric: '250 Clear-Title Acres',
    subMetric: '3.2 km to 110 kV Substation',
    details: 'Freehold title, 30-yr search report, high CUF wind & solar zone.',
    isConfidential: true
  },
  {
    id: 'TN-PWR-03',
    name: '15 MW Kayathar Wind-Solar Hybrid Project',
    type: 'POWER',
    state: 'Tamil Nadu',
    district: 'Kayathar, Tirunelveli District',
    coords: [9.0125, 77.7850],
    metric: '15 MW (9 MW Solar + 6 MW Wind)',
    subMetric: '₹3.70 / kWh • Group Captive',
    details: 'TANGEDCO parallel operation sanction on record. 0 Cross Subsidy Surcharge.'
  },
  {
    id: 'TN-REG-04',
    name: 'TANGEDCO / TNERC Regulatory HQ',
    type: 'REGULATOR',
    state: 'Tamil Nadu',
    district: 'Chennai District',
    coords: [13.0827, 80.2707],
    metric: 'State Grid Authority',
    subMetric: 'TNERC Pilot Jurisdiction',
    details: 'State nodal agency for Open Access and Group Captive verification.'
  },

  // Telangana
  {
    id: 'TG-BAY-05',
    name: '25 MW Jadcherla 132/33 kV Evacuation Bay',
    type: 'SUBSTATION_BAY',
    state: 'Telangana',
    district: 'Mahbubnagar District',
    coords: [16.7645, 78.1362],
    metric: '25 MW @ 132/33 kV',
    subMetric: 'TSTRANSCO Grid Interconnection',
    details: 'Dedicated feeder bay sanctioned for intra-state open access solar injection.',
    isConfidential: true
  },
  {
    id: 'TG-LND-06',
    name: '120 Acres Mahbubnagar Solar Park Land',
    type: 'LAND_PARCEL',
    state: 'Telangana',
    district: 'Mahbubnagar District',
    coords: [16.7488, 77.9856],
    metric: '120 Contiguous Acres',
    subMetric: '2.8 km to 132 kV Substation',
    details: 'Non-agricultural conversion complete. Flat terrain with high DNI.',
    isConfidential: true
  },
  {
    id: 'TG-PWR-07',
    name: '50 MW BESS & Solar Storage Facility',
    type: 'POWER',
    state: 'Telangana',
    district: 'Mahbubnagar / Rangareddy District',
    coords: [16.8200, 78.0500],
    metric: '50 MW Solar + 20 MWh BESS',
    subMetric: '₹4.15 / kWh Peak RTC',
    details: 'TSSPDCL HT industrial supply corridor serving Hyderabad data centers.'
  },
  {
    id: 'TG-REG-08',
    name: 'TSSPDCL / TSERC Regulatory HQ',
    type: 'REGULATOR',
    state: 'Telangana',
    district: 'Hyderabad District',
    coords: [17.3850, 78.4867],
    metric: 'TSERC Grid Authority',
    subMetric: 'TSERC Pilot Jurisdiction',
    details: 'Telangana State Load Despatch Centre (SLDC) & Discom open access nodal office.'
  },

  // Puducherry
  {
    id: 'PY-BAY-09',
    name: '15 MVA Sedarapet 110/22 kV Feeder Bay',
    type: 'SUBSTATION_BAY',
    state: 'Puducherry',
    district: 'Puducherry UT (Sedarapet Industrial Area)',
    coords: [11.9961, 79.7431],
    metric: '15 MVA @ 110/22 kV',
    subMetric: 'PED Substation Interconnection',
    details: 'Dedicated breaker bay for green energy injection into Sedarapet industrial belt.'
  },
  {
    id: 'PY-LND-10',
    name: '45 Acres Sedarapet PIPDIC Green Micro-Park',
    type: 'LAND_PARCEL',
    state: 'Puducherry',
    district: 'Puducherry UT (PIPDIC Industrial Corridor)',
    coords: [12.0012, 79.7485],
    metric: '45 Industrial Acres',
    subMetric: '1.1 km to 110/22 kV Substation',
    details: 'Clear title industrial zoned land. Ideal for captive solar & battery storage.'
  },
  {
    id: 'PY-PWR-11',
    name: '10 MW Puducherry Industrial Solar Cluster',
    type: 'POWER',
    state: 'Puducherry',
    district: 'Puducherry UT (Sedarapet / Villianur)',
    coords: [11.9890, 79.7550],
    metric: '10 MW Ground & Rooftop',
    subMetric: '₹3.95 / kWh • JERC GEOA',
    details: 'Supplying HT pharmaceutical and precision manufacturing consumers in Puducherry.'
  },
  {
    id: 'PY-REG-12',
    name: 'Electricity Dept Govt of Puducherry (PED)',
    type: 'REGULATOR',
    state: 'Puducherry',
    district: 'Puducherry District',
    coords: [11.9338, 79.8297],
    metric: 'PED Head Office',
    subMetric: 'JERC Pilot Jurisdiction',
    details: 'State discom controlling Puducherry, Karaikal, Mahe, and Yanam grid networks.'
  },

  // Gujarat, Rajasthan, Karnataka
  {
    id: 'GJ-PWR-13',
    name: '738 MW Charanka Solar Park',
    type: 'POWER',
    state: 'Gujarat',
    district: 'Patan District',
    coords: [23.9069, 71.2014],
    metric: '738 MW Solar Hub',
    subMetric: 'GETCO 400/220 kV Interconnection',
    details: 'Pioneering mega solar park connected to Western Regional Grid.'
  },
  {
    id: 'RJ-PWR-14',
    name: '2,245 MW Bhadla Solar Park',
    type: 'POWER',
    state: 'Rajasthan',
    district: 'Phalodi / Jodhpur District',
    coords: [27.5386, 71.9172],
    metric: '2,245 MW Ultra Mega Park',
    subMetric: 'CTU / POWERGRID 765 kV Grid',
    details: 'Largest single-location solar installation in India with high solar insolation.'
  },
  {
    id: 'KA-PWR-15',
    name: '2,050 MW Pavagada Solar Park',
    type: 'POWER',
    state: 'Karnataka',
    district: 'Tumakuru District',
    coords: [14.2811, 77.2797],
    metric: '2,050 MW Shakti Sthala',
    subMetric: 'KPTCL / CTU 400 kV Grid',
    details: 'Integrated mega solar park supplying industrial hubs across Southern India.'
  }
];

interface IndiaPowerMapProps {
  selectedState: string;
  onSelectState: (state: string) => void;
  onSelectListing?: (listingId: string) => void;
  setCurrentView?: (view: string) => void;
}

export const IndiaPowerMap: React.FC<IndiaPowerMapProps> = ({
  selectedState,
  onSelectState,
  onSelectListing,
  setCurrentView
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const [stateCounts, setStateCounts] = useState<Record<string, any>>({});
  const [activeFilterCategory, setActiveFilterCategory] = useState<'ALL' | 'SUBSTATION_BAY' | 'LAND_PARCEL' | 'POWER'>('ALL');
  const [mapStyle, setMapStyle] = useState<'OSM' | 'CARTO_VOYAGER' | 'SATELLITE'>('OSM');
  const [selectedMarker, setSelectedMarker] = useState<MapMarkerItem | null>(null);

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

  // Initialize Leaflet OpenStreetMap
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Center on India [22.0, 79.0] zoom 5
    const map = L.map(mapContainerRef.current, {
      center: [21.5, 79.5],
      zoom: 5,
      minZoom: 4,
      maxZoom: 18,
      zoomControl: true,
      attributionControl: true
    });

    // Default tile layer: OpenStreetMap Standard with exact country, state, district boundaries
    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors • Survey of India'
    }).addTo(map);

    tileLayerRef.current = osmLayer;
    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    // Ensure map tiles recalculate bounds properly on layout rendering
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);

    const handleResize = () => {
      map.invalidateSize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle Map Style Switch (OSM, CartoDB, Satellite)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    let url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    let attr = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

    if (mapStyle === 'CARTO_VOYAGER') {
      url = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
      attr = '© OpenStreetMap contributors © CARTO';
    } else if (mapStyle === 'SATELLITE') {
      url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      attr = 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';
    }

    const newLayer = L.tileLayer(url, {
      maxZoom: 19,
      attribution: attr
    }).addTo(map);

    tileLayerRef.current = newLayer;
  }, [mapStyle]);

  // Handle flyTo when selectedState changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (selectedState && INDIAN_POWER_STATES[selectedState]) {
      const stateInfo = INDIAN_POWER_STATES[selectedState];
      map.flyTo(stateInfo.center, stateInfo.zoom, {
        duration: 1.2
      });
    } else {
      map.flyTo([21.5, 79.5], 5, {
        duration: 1.0
      });
    }
  }, [selectedState]);

  // Render Markers on Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    const filtered = MAP_MARKERS.filter(m => {
      if (activeFilterCategory === 'ALL') return true;
      if (activeFilterCategory === 'SUBSTATION_BAY') return m.type === 'SUBSTATION_BAY';
      if (activeFilterCategory === 'LAND_PARCEL') return m.type === 'LAND_PARCEL';
      if (activeFilterCategory === 'POWER') return m.type === 'POWER';
      return true;
    });

    filtered.forEach(item => {
      // Create distinct styled HTML icon
      let bgClass = 'bg-teal-500';
      let borderClass = 'border-teal-300';
      let symbol = '⚡';

      if (item.type === 'SUBSTATION_BAY') {
        bgClass = 'bg-cyan-600 text-white';
        borderClass = 'border-cyan-300 ring-4 ring-cyan-500/20';
        symbol = '⚡';
      } else if (item.type === 'LAND_PARCEL') {
        bgClass = 'bg-emerald-600 text-white';
        borderClass = 'border-emerald-300 ring-4 ring-emerald-500/20';
        symbol = '🏞️';
      } else if (item.type === 'POWER') {
        bgClass = 'bg-amber-500 text-white';
        borderClass = 'border-amber-300 ring-4 ring-amber-500/20';
        symbol = '☀️';
      } else if (item.type === 'REGULATOR') {
        bgClass = 'bg-indigo-700 text-white';
        borderClass = 'border-indigo-300';
        symbol = '🏛️';
      }

      const iconHtml = `
        <div style="position: relative; display: flex; align-items: center; justify-content: center; cursor: pointer;">
          <div style="
            width: 32px; 
            height: 32px; 
            border-radius: 9999px; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            font-size: 14px; 
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            border: 2px solid white;
          " class="${bgClass} ${borderClass}">
            ${symbol}
          </div>
          ${item.isConfidential ? `
            <div style="position: absolute; top: -4px; right: -4px; background: #0f172a; color: #5eead4; border-radius: 9999px; padding: 2px 4px; font-size: 8px; font-weight: bold; border: 1px solid #334155;">
              NDA
            </div>
          ` : ''}
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-eb-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -18]
      });

      const marker = L.marker(item.coords, { icon: customIcon });

      const popupContent = `
        <div style="font-family: system-ui, sans-serif; min-width: 200px; padding: 2px;">
          <div style="font-size: 10px; font-weight: bold; color: #0d9488; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px;">
            ${item.state} • ${item.district}
          </div>
          <div style="font-size: 13px; font-weight: 800; color: #0f172a; line-height: 1.2; margin-bottom: 6px;">
            ${item.name}
          </div>
          <div style="background: #f1f5f9; padding: 6px 8px; border-radius: 8px; margin-bottom: 6px; font-size: 11px;">
            <div style="font-weight: 700; color: #0f172a;">${item.metric}</div>
            <div style="color: #64748b; font-size: 10px;">${item.subMetric}</div>
          </div>
          <div style="font-size: 11px; color: #334155; line-height: 1.4; margin-bottom: 6px;">
            ${item.details}
          </div>
          ${item.isConfidential ? `
            <div style="font-size: 9px; font-weight: bold; color: #0d9488; background: #f0fdfa; border: 1px solid #ccfbf1; padding: 2px 6px; border-radius: 4px; margin-bottom: 6px;">
              🔒 Mutual NDA Protected Infrastructure
            </div>
          ` : ''}
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on('click', () => {
        setSelectedMarker(item);
        if (item.state !== selectedState) {
          onSelectState(item.state);
        }
      });

      markersLayer.addLayer(marker);
    });
  }, [activeFilterCategory, selectedState]);

  const activeInfo = selectedState ? INDIAN_POWER_STATES[selectedState] : null;
  const activeCountData = selectedState ? stateCounts[selectedState] : null;

  return (
    <div className="bg-slate-900 rounded-3xl p-5 sm:p-7 text-white shadow-2xl border border-slate-800 space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-extrabold bg-teal-500/20 text-teal-300 border border-teal-500/30 mb-2">
            <Compass className="w-3.5 h-3.5 text-teal-400" />
            <span>OpenStreetMap India Power & Infrastructure Navigator</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white brand-font tracking-tight">
            Interactive India Power Map
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Real OpenStreetMap view with exact <strong>Country boundaries</strong>, <strong>State borders</strong>, and <strong>District lines</strong>. Explore sub-station evacuation bays, land parcels, and solar/wind parks across <strong>Tamil Nadu</strong>, <strong>Telangana</strong>, <strong>Puducherry</strong>, and pan-India.
          </p>
        </div>

        {/* Map Style Controls & Full View */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-slate-800 p-1 rounded-xl flex items-center border border-slate-700 text-xs font-bold">
            <button
              onClick={() => setMapStyle('OSM')}
              className={`px-3 py-1.5 rounded-lg transition ${
                mapStyle === 'OSM' ? 'bg-teal-500 text-navy-950 font-extrabold shadow' : 'text-slate-300 hover:text-white'
              }`}
            >
              🗺️ OpenStreetMap
            </button>
            <button
              onClick={() => setMapStyle('CARTO_VOYAGER')}
              className={`px-3 py-1.5 rounded-lg transition ${
                mapStyle === 'CARTO_VOYAGER' ? 'bg-teal-500 text-navy-950 font-extrabold shadow' : 'text-slate-300 hover:text-white'
              }`}
            >
              🧭 Navigation
            </button>
            <button
              onClick={() => setMapStyle('SATELLITE')}
              className={`px-3 py-1.5 rounded-lg transition ${
                mapStyle === 'SATELLITE' ? 'bg-teal-500 text-navy-950 font-extrabold shadow' : 'text-slate-300 hover:text-white'
              }`}
            >
              🛰️ Satellite
            </button>
          </div>
        </div>
      </div>

      {/* Fast State Jump Pill Selector */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-thin">
        <span className="text-xs font-bold uppercase text-slate-400 whitespace-nowrap flex items-center space-x-1">
          <Navigation className="w-3.5 h-3.5 text-teal-400" />
          <span>Jump to:</span>
        </span>
        <button
          onClick={() => onSelectState('')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap border ${
            !selectedState 
              ? 'bg-teal-500 text-navy-950 border-teal-400 shadow-md font-extrabold' 
              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
          }`}
        >
          🇮🇳 Pan-India Overview
        </button>

        {Object.keys(INDIAN_POWER_STATES).map(stName => {
          const st = INDIAN_POWER_STATES[stName];
          const isSelected = selectedState === stName;
          return (
            <button
              key={stName}
              onClick={() => onSelectState(stName)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center space-x-1.5 border ${
                isSelected
                  ? 'bg-teal-500 text-navy-950 border-teal-400 shadow-md font-extrabold'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              {st.isPilot && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
              <span>{stName}</span>
              {st.isPilot && (
                <span className={`text-[9px] px-1 rounded uppercase ${isSelected ? 'bg-navy-900 text-teal-300' : 'bg-slate-700 text-amber-300'}`}>
                  Pilot
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Layer Filter Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 flex items-center space-x-1">
            <Layers className="w-3.5 h-3.5 text-teal-400" />
            <span>Map Layers:</span>
          </span>
          <button
            onClick={() => setActiveFilterCategory('ALL')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
              activeFilterCategory === 'ALL'
                ? 'bg-teal-500 text-navy-950 font-extrabold'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            All Pins ({MAP_MARKERS.length})
          </button>
          <button
            onClick={() => setActiveFilterCategory('SUBSTATION_BAY')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1 ${
              activeFilterCategory === 'SUBSTATION_BAY'
                ? 'bg-cyan-500 text-navy-950 font-extrabold'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <span>⚡ Substation Bays</span>
            <span className="text-[10px] bg-slate-900/60 px-1.5 py-0.2 rounded">
              {MAP_MARKERS.filter(m => m.type === 'SUBSTATION_BAY').length}
            </span>
          </button>
          <button
            onClick={() => setActiveFilterCategory('LAND_PARCEL')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1 ${
              activeFilterCategory === 'LAND_PARCEL'
                ? 'bg-emerald-500 text-navy-950 font-extrabold'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <span>🏞️ Land Parcels</span>
            <span className="text-[10px] bg-slate-900/60 px-1.5 py-0.2 rounded">
              {MAP_MARKERS.filter(m => m.type === 'LAND_PARCEL').length}
            </span>
          </button>
          <button
            onClick={() => setActiveFilterCategory('POWER')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1 ${
              activeFilterCategory === 'POWER'
                ? 'bg-amber-500 text-navy-950 font-extrabold'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <span>☀️ Solar / Wind Plants</span>
            <span className="text-[10px] bg-slate-900/60 px-1.5 py-0.2 rounded">
              {MAP_MARKERS.filter(m => m.type === 'POWER').length}
            </span>
          </button>
        </div>

        <div className="text-[11px] text-slate-400">
          Tip: Zoom in using <strong className="text-teal-300">+</strong> or mouse scroll to view exact district boundaries and local substations.
        </div>
      </div>

      {/* Main Grid: Interactive OpenStreetMap (Left 2 Cols) + Regulatory & Counts Flyout (Right 1 Col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* OpenStreetMap Canvas */}
        <div className="lg:col-span-2 relative rounded-2xl overflow-hidden border border-slate-700 shadow-inner bg-slate-950 h-[520px]">
          <div ref={mapContainerRef} className="w-full h-full z-0" />

          {/* Map Overlay Badge */}
          <div className="absolute top-3 left-3 z-[400] bg-navy-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 text-xs shadow-lg flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
            <span className="font-bold text-teal-300">
              {selectedState ? `${selectedState} Grid Jurisdiction` : 'All-India Transmission Grid'}
            </span>
            <span className="text-slate-400 text-[10px]">
              • Survey of India & OSM verified borders
            </span>
          </div>

          {/* Map Legend at bottom left */}
          <div className="absolute bottom-3 left-3 z-[400] bg-navy-950/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-700 text-[10px] shadow-lg flex flex-wrap items-center gap-3">
            <span className="flex items-center space-x-1 text-cyan-300 font-bold">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>Evacuation Bay</span>
            </span>
            <span className="flex items-center space-x-1 text-emerald-300 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Land Parcel</span>
            </span>
            <span className="flex items-center space-x-1 text-amber-300 font-bold">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Solar / Wind Plant</span>
            </span>
            <span className="flex items-center space-x-1 text-indigo-300 font-bold">
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              <span>Regulator / Discom</span>
            </span>
          </div>
        </div>

        {/* Right Column: Dynamic State & Infrastructure Intelligence Panel */}
        <div className="space-y-4">
          {activeInfo ? (
            <div className="bg-slate-800/90 border border-teal-500/30 rounded-2xl p-5 space-y-4 shadow-xl backdrop-blur-md relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-1.5">
                    {activeInfo.isPilot && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-teal-500 text-navy-950">
                        Pilot State
                      </span>
                    )}
                    <span className="text-xs font-mono font-bold text-teal-400">{activeInfo.code}</span>
                  </div>
                  <h3 className="text-xl font-extrabold text-white mt-1 brand-font">
                    {activeInfo.name}
                  </h3>
                </div>
                <button
                  onClick={() => onSelectState('')}
                  className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-700/60"
                >
                  ✕ Clear
                </button>
              </div>

              {/* Regulatory Snapshot */}
              <div className="space-y-2 text-xs border-y border-slate-700/80 py-3">
                <div>
                  <span className="text-slate-400 text-[10px] block font-bold uppercase">Regulator (SERC)</span>
                  <span className="font-semibold text-slate-200">{activeInfo.regulator}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block font-bold uppercase">Operating Discoms</span>
                  <span className="font-semibold text-slate-200">{activeInfo.discom}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block font-bold uppercase">Open Access Eligibility Threshold</span>
                  <span className="font-bold text-teal-300">{activeInfo.openAccessThreshold}</span>
                </div>
              </div>

              {/* Tariffs & Capacity metrics */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-700">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Grid HT Tariff</span>
                  <span className="text-base font-extrabold text-amber-400">
                    ₹{activeInfo.typicalIndustrialTariff.toFixed(2)}
                    <span className="text-[10px] font-normal text-slate-400">/u</span>
                  </span>
                </div>
                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-700">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Open Access Avail</span>
                  <span className="text-base font-extrabold text-teal-400">
                    {activeCountData?.totalCapacityMw || 40}+ MW
                  </span>
                </div>
                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-700">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Evacuation Bays</span>
                  <span className="text-sm font-extrabold text-cyan-300">
                    {activeCountData?.substationBays || 1} Sanctioned
                  </span>
                </div>
                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-700">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Land Parcels</span>
                  <span className="text-sm font-extrabold text-emerald-300">
                    {activeCountData?.landParcels || 1} Park Bank
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-1 space-y-2">
                <button
                  onClick={() => {
                    const el = document.getElementById('marketplace-listings-grid');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full bg-teal-500 hover:bg-teal-400 text-navy-950 font-black py-2.5 px-3 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition shadow-lg shadow-teal-500/20"
                >
                  <span>Explore {activeInfo.name} Listings</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                {setCurrentView && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setCurrentView('calculator')}
                      className="bg-slate-900 hover:bg-slate-700 text-slate-200 py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1 transition border border-slate-700"
                    >
                      <Sliders className="w-3 h-3 text-teal-400" />
                      <span>Landed Cost</span>
                    </button>

                    <button
                      onClick={() => setCurrentView('wizard')}
                      className="bg-slate-900 hover:bg-slate-700 text-slate-200 py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1 transition border border-slate-700"
                    >
                      <Activity className="w-3 h-3 text-amber-400" />
                      <span>Bill Wizard</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 mx-auto">
                <Compass className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Select a State or Infrastructure Marker</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Click on <strong>Tamil Nadu</strong>, <strong>Telangana</strong>, or <strong>Puducherry</strong> markers on the OpenStreetMap to inspect substation bay voltage, land acres, and SERC Discom open access tariffs.
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-1.5 pt-1">
                {['Tamil Nadu', 'Telangana', 'Puducherry', 'Gujarat', 'Maharashtra'].map(st => (
                  <button
                    key={st}
                    onClick={() => onSelectState(st)}
                    className="bg-slate-900 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1 rounded-lg text-xs font-semibold transition border border-slate-700"
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Active Selected Marker Card (if clicked) */}
          {selectedMarker && (
            <div className="bg-slate-900/90 border border-teal-500/40 rounded-2xl p-4 text-xs space-y-2 shadow-lg">
              <div className="flex justify-between items-start">
                <span className="text-[10px] uppercase font-bold text-teal-400 flex items-center space-x-1">
                  <MapPin className="w-3 h-3" />
                  <span>{selectedMarker.district}</span>
                </span>
                <button
                  onClick={() => setSelectedMarker(null)}
                  className="text-slate-500 hover:text-white text-xs"
                >
                  ✕
                </button>
              </div>
              <div className="font-extrabold text-sm text-white">
                {selectedMarker.name}
              </div>
              <div className="text-slate-300 text-[11px] leading-relaxed">
                {selectedMarker.details}
              </div>
              <div className="pt-1 flex items-center justify-between text-[11px]">
                <span className="text-teal-300 font-bold">{selectedMarker.metric}</span>
                <span className="text-slate-400">{selectedMarker.subMetric}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
