import React, { useState } from 'react';
import { 
  Zap, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight, 
  Upload, 
  FileCheck, 
  Building2,
  AlertCircle,
  Lock
} from 'lucide-react';
import { api } from '../services/api';

interface SellPowerPageProps {
  setCurrentView: (view: string) => void;
}

export const SellPowerPage: React.FC<SellPowerPageProps> = ({ setCurrentView }) => {
  const [formData, setFormData] = useState({
    title: '15 MW Wind-Solar Hybrid Project - Kayathar, Tamil Nadu',
    category: 'HYBRID_RENEWABLE',
    commercialModel: 'GROUP_CAPTIVE',
    state: 'Tamil Nadu',
    projectLocation: 'Kayathar / Radhapuram Corridor, Tirunelveli, Tamil Nadu',
    totalCapacityMw: 15.0,
    availableCapacityMw: 6.0,
    indicativePricePerKwh: 3.70,
    priceBasisConditions: 'Ex-busbar at TANTRANSCO 33 kV substation. 15-year tenure. 0 CSS under Group Captive SPV.',
    contractDurationYears: 15,
    expectedAvailabilityDate: '2026-10-30',
    interconnectionType: 'STU_INTRA_STATE',
    substationDetails: '33/110 kV TANTRANSCO Substation, Kayathar',
    projectStatus: 'OPERATIONAL',
    regulatoryApprovals: 'TANGEDCO grid parallel operation sanction and CEIG statutory safety approvals on record.',
    technology: 'Hybrid: 9 MW Solar TopCon Bifacial + 6 MW Wind Gamesa G97 2.0 MW WTGs',
    cuFactorPercent: 36.4,
    captiveStructureInfo: 'Structured SPV compliant with Electricity Rules 2005 (26% equity holding and 51% proportional consumption).',
    // New fields
    isConfidential: false,
    ndaRequired: false,
    substationVoltageKv: 110,
    bayCapacityMw: 25.0,
    landAreaAcres: 150.0
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdListingCode, setCreatedListingCode] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload: any = {
        title: formData.title,
        category: formData.category,
        commercialModel: formData.commercialModel,
        state: formData.state,
        projectLocation: formData.projectLocation,
        totalCapacityMw: formData.totalCapacityMw,
        availableCapacityMw: formData.availableCapacityMw,
        indicativePricePerKwh: formData.indicativePricePerKwh,
        priceBasisConditions: formData.priceBasisConditions,
        contractDurationYears: formData.contractDurationYears,
        expectedAvailabilityDate: formData.expectedAvailabilityDate,
        interconnectionType: formData.interconnectionType,
        substationDetails: formData.substationDetails,
        projectStatus: formData.projectStatus,
        regulatoryApprovals: formData.regulatoryApprovals,
        isConfidential: formData.isConfidential,
        ndaRequired: formData.ndaRequired,
        bayCapacityMw: formData.category === 'SUBSTATION_BAY' ? formData.bayCapacityMw : undefined,
        substationVoltageKv: formData.category === 'SUBSTATION_BAY' ? formData.substationVoltageKv : undefined,
        landAreaAcres: formData.category === 'LAND_PARCEL' ? formData.landAreaAcres : undefined,
        renewableDetails: {
          technology: formData.technology,
          cuFactorPercent: formData.cuFactorPercent,
          captiveStructureInfo: formData.captiveStructureInfo
        }
      };

      const res = await api.createListing(payload);
      setCreatedListingCode(res.listingCode);
    } catch (err: any) {
      alert(`Submission Note: ${err.message || 'Please sign in with a developer/seller account to create listings.'}`);
      if (!localStorage.getItem('eb_token')) {
        setCurrentView('login');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-teal-600 uppercase tracking-wider mb-1">
          <Zap className="w-3.5 h-3.5" />
          <span>Renewable Developers & Asset Owners</span>
        </div>
        <h1 className="text-3xl font-extrabold text-navy-900 brand-font">
          List Power Supply & Renewable Energy Opportunities
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
          Reach qualified commercial and industrial consumers actively seeking solar, wind, hybrid, <strong>evacuation substation bays</strong>, and <strong>land parcels</strong> across <strong>Tamil Nadu</strong>, <strong>Telangana</strong>, <strong>Puducherry</strong>, and India.
        </p>
      </div>

      {createdListingCode ? (
        <div className="bg-white rounded-3xl border border-teal-200 p-8 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-navy-900 brand-font">
            Listing Draft Created Successfully!
          </h2>
          <div className="text-xs text-slate-600">
            Assigned Code: <span className="font-mono font-bold text-teal-700 text-sm">{createdListingCode}</span>
          </div>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Your listing is currently saved in your developer dashboard. You can upload supporting CEIG/grid connectivity approvals and submit it to verification officers for publication.
          </p>
          <div className="pt-4 flex justify-center space-x-3">
            <button
              onClick={() => setCurrentView('dashboard')}
              className="bg-navy-900 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition"
            >
              Go to Developer Dashboard
            </button>
            <button
              onClick={() => setCurrentView('marketplace')}
              className="bg-teal-600 text-navy-900 font-bold px-6 py-2.5 rounded-xl text-xs transition"
            >
              Browse Public Explorer
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm space-y-6">
          {/* Section 1: Asset Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-navy-900 uppercase tracking-wider pb-2 border-b border-slate-100">
              1. Project Identification & Location
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Listing Title
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Technology Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="SOLAR_POWER">Solar Power</option>
                  <option value="WIND_POWER">Wind Power</option>
                  <option value="HYBRID_RENEWABLE">Hybrid Renewable (Solar + Wind)</option>
                  <option value="RTC_FIRM_POWER">Round-The-Clock (RTC) Firm Clean Power</option>
                  <option value="SUBSTATION_BAY">⚡ Evacuation Bay & Substation Interconnection</option>
                  <option value="LAND_PARCEL">🏞 Renewable Land Bank & Park Parcel</option>
                  <option value="BATTERY_STORAGE">Battery Energy Storage (BESS)</option>
                  <option value="PUMPED_HYDRO_STORAGE">Pumped Hydro Storage (PSP)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  State / Grid Jurisdiction
                </label>
                <select
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="Tamil Nadu">Tamil Nadu (TNERC / TANGEDCO) — Pilot Focus</option>
                  <option value="Telangana">Telangana (TSERC / TSSPDCL) — Pilot Focus</option>
                  <option value="Puducherry">Puducherry (JERC / PED) — Pilot Focus</option>
                  <option value="Gujarat">Gujarat (GERC / GUVNL)</option>
                  <option value="Rajasthan">Rajasthan (RERC / Discoms)</option>
                  <option value="Maharashtra">Maharashtra (MERC / MSEDCL)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Project Physical Location & Substation Connection
                </label>
                <input
                  type="text"
                  required
                  value={formData.projectLocation}
                  onChange={(e) => setFormData({ ...formData, projectLocation: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              {/* Substation Bay specific inputs */}
              {formData.category === 'SUBSTATION_BAY' && (
                <>
                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Substation Voltage Class (kV)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 33, 110, 132, 230"
                      value={formData.substationVoltageKv}
                      onChange={(e) => setFormData({ ...formData, substationVoltageKv: parseFloat(e.target.value) })}
                      className="w-full bg-teal-50 border border-teal-200 rounded-lg p-2.5 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Bay Evacuation Capacity (MW)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 25, 40"
                      value={formData.bayCapacityMw}
                      onChange={(e) => setFormData({ ...formData, bayCapacityMw: parseFloat(e.target.value) })}
                      className="w-full bg-teal-50 border border-teal-200 rounded-lg p-2.5 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                </>
              )}

              {/* Land Parcel specific inputs */}
              {formData.category === 'LAND_PARCEL' && (
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Total Contiguous Land Bank (Acres)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 250"
                    value={formData.landAreaAcres}
                    onChange={(e) => setFormData({ ...formData, landAreaAcres: parseFloat(e.target.value) })}
                    className="w-full bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Capacity & Commercial Framework */}
          <div className="space-y-4 pt-4">
            <h3 className="text-sm font-bold text-navy-900 uppercase tracking-wider pb-2 border-b border-slate-100">
              2. Capacity & Commercial Pricing Terms
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Total Plant Capacity (MW)
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={formData.totalCapacityMw}
                  onChange={(e) => setFormData({ ...formData, totalCapacityMw: parseFloat(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Available for Offtake (MW)
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={formData.availableCapacityMw}
                  onChange={(e) => setFormData({ ...formData, availableCapacityMw: parseFloat(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Indicative PPA Tariff (₹/kWh)
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={formData.indicativePricePerKwh}
                  onChange={(e) => setFormData({ ...formData, indicativePricePerKwh: parseFloat(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Commercial Structure
                </label>
                <select
                  value={formData.commercialModel}
                  onChange={(e) => setFormData({ ...formData, commercialModel: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="GROUP_CAPTIVE">Group Captive (26% Equity / 0 CSS)</option>
                  <option value="THIRD_PARTY_OPEN_ACCESS">Third-Party Open Access</option>
                  <option value="ENERGY_STORAGE_SERVICE_AGREEMENT">Energy Storage (ESSA)</option>
                  <option value="CAPEX_SALE">Turnkey Capex / Land Lease</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Interconnection Grid
                </label>
                <select
                  value={formData.interconnectionType}
                  onChange={(e) => setFormData({ ...formData, interconnectionType: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="STU_INTRA_STATE">STU Intra-State Grid (TANTRANSCO / TSTRANSCO / PED)</option>
                  <option value="CTU_INTER_STATE">CTU Inter-State Grid (POWERGRID)</option>
                  <option value="BEHIND_THE_METER">Behind the Meter</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Plant Operational Readiness
                </label>
                <select
                  value={formData.projectStatus}
                  onChange={(e) => setFormData({ ...formData, projectStatus: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="OPERATIONAL">Operational (Immediate Offtake)</option>
                  <option value="UNDER_CONSTRUCTION">Under Construction</option>
                  <option value="READY_TO_BUILD">Ready to Build (Connectivity Sanctioned)</option>
                  <option value="ADVANCED_DEVELOPMENT">Advanced Development</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tariff Basis & Escalation Conditions
                </label>
                <input
                  type="text"
                  value={formData.priceBasisConditions}
                  onChange={(e) => setFormData({ ...formData, priceBasisConditions: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Confidentiality & Mutual NDA Protection */}
          <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center space-x-2 text-teal-400 font-bold text-xs">
              <Lock className="w-4 h-4" />
              <span>Inquiry Brokering & Confidentiality Protection</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Enable this toggle if you wish to mask exact GPS coordinates, substation feeder numbers, and direct contacts from unverified visitors. Corporate buyers will be prompted to issue a formal LOI and sign the Electricity Bazaar Mutual NDA before unlocking.
            </p>
            <div className="flex items-center space-x-3 pt-1">
              <input
                type="checkbox"
                id="confidentialToggle"
                checked={formData.isConfidential}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  isConfidential: e.target.checked,
                  ndaRequired: e.target.checked 
                })}
                className="w-4 h-4 accent-teal-500 rounded"
              />
              <label htmlFor="confidentialToggle" className="text-xs font-bold text-teal-200 cursor-pointer">
                Protect Asset: Require Mutual NDA / LOI prior to disclosing exact coordinates and SLD
              </label>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-teal-600 hover:bg-teal-500 text-navy-900 font-bold px-8 py-3 rounded-xl text-sm flex items-center space-x-2 transition shadow-md shadow-teal-600/20 disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Registering Opportunity...' : 'Create Listing Draft'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
