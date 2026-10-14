import React, { useState } from 'react';
import { 
  Building2, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight, 
  Zap, 
  Lock, 
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';

interface BuyPowerPageProps {
  setCurrentView: (view: string) => void;
}

export const BuyPowerPage: React.FC<BuyPowerPageProps> = ({ setCurrentView }) => {
  const [formData, setFormData] = useState({
    title: '3.5 MW Group Captive Off-take for Industrial Facility',
    industryType: 'Automotive Components / Engineering',
    state: 'Tamil Nadu',
    discomName: 'TANGEDCO (Tamil Nadu Generation & Distribution Corp)',
    numberOfFacilities: 1,
    contractDemandKva: 4200,
    sanctionedLoadKw: 3500,
    monthlyConsumptionKwh: 850000,
    currentSupplyCostPerKwh: 8.75,
    targetRenewablePercent: 80,
    preferredTechnology: 'Solar Mono-PERC / Wind Hybrid',
    commercialModel: 'GROUP_CAPTIVE',
    requiredStartDate: '2026-11-15',
    contractTenureYears: 15,
    openAccessPreference: 'Group Captive (26% Equity / 0 CSS)',
    additionalNotes: '',
    isConsentGivenToShare: true
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedCode, setSubmittedCode] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.createRequirement(formData);
      setSubmittedCode(res.requirementCode);
    } catch (err: any) {
      alert(`Submission Note: ${err.message || 'Please sign in or register to submit buyer requirements.'}`);
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
          <Building2 className="w-3.5 h-3.5" />
          <span>Industrial & Commercial Consumers</span>
        </div>
        <h1 className="text-3xl font-extrabold text-navy-900 brand-font">
          Submit Electricity Procurement Requirement
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
          Post your power requirements privately. We match your load profile against verified solar, wind, and captive suppliers. Your exact consumption records remain confidential and are only shared with developer counterparties upon your explicit consent.
        </p>
      </div>

      {submittedCode ? (
        <div className="bg-white rounded-3xl border border-teal-200 p-8 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-navy-900 brand-font">
            Requirement Submitted Successfully!
          </h2>
          <div className="text-xs text-slate-600">
            Assigned Unique Code: <span className="font-mono font-bold text-teal-700 text-sm">{submittedCode}</span>
          </div>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Our matchmaking engine is evaluating active supplier inventory across your state grid. You can track compatible offers in your buyer dashboard.
          </p>
          <div className="pt-4 flex justify-center space-x-3">
            <button
              onClick={() => setCurrentView('dashboard')}
              className="bg-navy-900 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition"
            >
              Open Buyer Dashboard
            </button>
            <button
              onClick={() => setCurrentView('wizard')}
              className="bg-teal-600 text-navy-900 font-bold px-6 py-2.5 rounded-xl text-xs transition"
            >
              Simulate in Bill Wizard
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm space-y-6">
          {/* Section 1: Facility & Location */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-navy-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center justify-between">
              <span>1. Facility Location & Interconnection</span>
              <span className="text-[11px] text-teal-700 font-semibold">Step 1 of 3</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Procurement Requirement Title
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. 5 MW Clean Energy Offtake for Jeedimetla Unit"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Industry / Manufacturing Sector
                </label>
                <input
                  type="text"
                  required
                  value={formData.industryType}
                  onChange={(e) => setFormData({ ...formData, industryType: e.target.value })}
                  placeholder="e.g. Auto Foundry, Pharma, Textiles, Data Center"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  State / Jurisdiction
                </label>
                <select
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="Tamil Nadu">Tamil Nadu (TNERC) — Pilot</option>
                  <option value="Telangana">Telangana (TSERC) — Pilot</option>
                  <option value="Gujarat">Gujarat (GERC)</option>
                  <option value="Rajasthan">Rajasthan (RERC)</option>
                  <option value="Maharashtra">Maharashtra (MERC)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Distribution Licensee (DISCOM)
                </label>
                <input
                  type="text"
                  required
                  value={formData.discomName}
                  onChange={(e) => setFormData({ ...formData, discomName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Demand & Consumption */}
          <div className="space-y-4 pt-4">
            <h3 className="text-sm font-bold text-navy-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center justify-between">
              <span>2. Demand & Consumption Profile</span>
              <span className="text-[11px] text-teal-700 font-semibold">Step 2 of 3</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Contract Demand (kVA)
                </label>
                <input
                  type="number"
                  required
                  value={formData.contractDemandKva}
                  onChange={(e) => setFormData({ ...formData, contractDemandKva: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Sanctioned Load (kW)
                </label>
                <input
                  type="number"
                  required
                  value={formData.sanctionedLoadKw}
                  onChange={(e) => setFormData({ ...formData, sanctionedLoadKw: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Monthly Consumption (kWh)
                </label>
                <input
                  type="number"
                  required
                  value={formData.monthlyConsumptionKwh}
                  onChange={(e) => setFormData({ ...formData, monthlyConsumptionKwh: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Current Landed Tariff (₹/kWh)
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={formData.currentSupplyCostPerKwh}
                  onChange={(e) => setFormData({ ...formData, currentSupplyCostPerKwh: parseFloat(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Target Renewable Share (%)
                </label>
                <input
                  type="number"
                  min="20"
                  max="100"
                  value={formData.targetRenewablePercent}
                  onChange={(e) => setFormData({ ...formData, targetRenewablePercent: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Preferred Technology
                </label>
                <input
                  type="text"
                  value={formData.preferredTechnology}
                  onChange={(e) => setFormData({ ...formData, preferredTechnology: e.target.value })}
                  placeholder="e.g. Solar, Wind, RTC"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Commercial Structure & Consent */}
          <div className="space-y-4 pt-4">
            <h3 className="text-sm font-bold text-navy-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center justify-between">
              <span>3. Commercial Model & Timeline</span>
              <span className="text-[11px] text-teal-700 font-semibold">Step 3 of 3</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Procurement Model
                </label>
                <select
                  value={formData.commercialModel}
                  onChange={(e) => setFormData({ ...formData, commercialModel: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="GROUP_CAPTIVE">Group Captive (26% Equity / 0 CSS)</option>
                  <option value="THIRD_PARTY_OPEN_ACCESS">Third-Party Open Access</option>
                  <option value="ROOFTOP_PPA_OPEX">On-site Rooftop OPEX</option>
                  <option value="CAPEX_SALE">Turnkey Capex</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Requested Supply Start Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.requiredStartDate}
                  onChange={(e) => setFormData({ ...formData, requiredStartDate: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Contract Tenure (Years)
                </label>
                <input
                  type="number"
                  min="1"
                  max="25"
                  value={formData.contractTenureYears}
                  onChange={(e) => setFormData({ ...formData, contractTenureYears: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Confidentiality Gate Checkbox */}
            <div className="pt-2 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-2">
              <div className="flex items-center space-x-2 font-bold text-navy-900">
                <Lock className="w-4 h-4 text-teal-600" />
                <span>Buyer Privacy & Commercial Safeguards</span>
              </div>
              <div className="flex items-start space-x-2 text-[11px] leading-relaxed text-slate-600">
                <input
                  type="checkbox"
                  id="buyerReqConsent"
                  checked={formData.isConsentGivenToShare}
                  onChange={(e) => setFormData({ ...formData, isConsentGivenToShare: e.target.checked })}
                  className="accent-teal-600 rounded mt-0.5"
                />
                <label htmlFor="buyerReqConsent">
                  I authorize Electricity Bazaar to index this requirement for deterministic matching with verified developers. My identity will not be shared without an active mutual enquiry.
                </label>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-teal-600 hover:bg-teal-500 text-navy-900 font-bold px-8 py-3 rounded-xl text-sm flex items-center space-x-2 transition shadow-md shadow-teal-600/20 disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Registering Requirement...' : 'Submit Procurement Requirement'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
