import React from 'react';
import { Zap, ShieldAlert, Mail, Phone, MapPin } from 'lucide-react';

interface FooterProps {
  setCurrentView: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ setCurrentView }) => {
  return (
    <footer className="bg-navy-900 border-t border-slate-800 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center">
                <Zap className="w-5 h-5 text-navy-900 fill-current" />
              </div>
              <span className="text-lg font-bold text-white brand-font">Electricity Bazaar</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              India's B2B digital marketplace for power procurement intelligence, renewable energy developer discovery, group captive structuring, and landed-cost modeling.
            </p>
            <div className="pt-2 text-xs text-teal-400 font-medium">
              Flagship Pilot: Tamil Nadu & Telangana
            </div>
          </div>

          {/* Marketplace Navigation */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-xs uppercase tracking-wider">Marketplace</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => setCurrentView('marketplace')} className="hover:text-teal-400 transition">
                  Browse All Power Listings
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentView('wizard')} className="hover:text-amber-400 text-amber-300 transition font-medium">
                  ★ Bill-to-Procurement Wizard
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentView('calculator')} className="hover:text-teal-400 transition">
                  Landed Cost Economics Calculator
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentView('storage')} className="hover:text-teal-400 transition">
                  Battery Storage (BESS) & Pumped Hydro
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentView('tenders')} className="hover:text-teal-400 transition">
                  Energy Tenders & Opportunities
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentView('services')} className="hover:text-teal-400 transition">
                  Advisory, EPC & Energy Audits
                </button>
              </li>
            </ul>
          </div>

          {/* Solutions & Accounts */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-xs uppercase tracking-wider">Solutions</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => setCurrentView('buy-power')} className="hover:text-teal-400 transition">
                  Submit Buyer Power Requirement
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentView('sell-power')} className="hover:text-teal-400 transition">
                  List Renewable / Storage Asset
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentView('dashboard')} className="hover:text-teal-400 transition">
                  Corporate Procurement Workspace
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentView('legal-about')} className="hover:text-teal-400 transition">
                  About Electricity Bazaar
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentView('legal-contact')} className="hover:text-teal-400 transition">
                  Contact Advisory Team
                </button>
              </li>
            </ul>
          </div>

          {/* Compliance & Contact */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-xs uppercase tracking-wider">Governance & Contact</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => setCurrentView('legal-terms')} className="hover:text-teal-400 transition">
                  Terms of Use
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentView('legal-privacy')} className="hover:text-teal-400 transition">
                  Privacy & Data Consent Policy
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentView('legal-disclaimer')} className="hover:text-teal-400 transition">
                  Regulatory Boundaries & Disclaimer
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentView('legal-grievance')} className="hover:text-teal-400 transition">
                  Grievance Officer
                </button>
              </li>
            </ul>
            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center space-x-2">
                <Mail className="w-3.5 h-3.5 text-teal-400" />
                <span>support@electricitybazaar.in</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-3.5 h-3.5 text-teal-400" />
                <span>Chennai / Hyderabad / Bengaluru</span>
              </div>
            </div>
          </div>
        </div>

        {/* Regulatory Disclaimer Banner */}
        <div className="mt-10 pt-6 border-t border-slate-800 bg-slate-900/50 p-4 rounded-xl border border-slate-800/80">
          <div className="flex items-start space-x-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-slate-400 leading-relaxed">
              <strong className="text-slate-200">STATUTORY REGULATORY NOTICE:</strong> Electricity Bazaar is an informational marketplace, matching, and enquiry platform. It is <strong>not</strong> an authorized electricity power exchange (such as IEX, PXIL, or HPX), is <strong>not</strong> a licensed electricity trading entity under Section 14 of the Electricity Act 2003, and does not execute binding scheduling, dispatch, or settlement. Open access offtake, captive equity subscription, and wheeling remain subject to respective State Electricity Regulatory Commissions (TNERC, TSERC, GERC, MERC, etc.), Central Electricity Regulatory Commission (CERC) regulations, and bilateral Power Purchase Agreements executed between contracting entities.
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-400">
          <div>
            &copy; {new Date().getFullYear()} Electricity Bazaar | India's Electricity & Energy Marketplace. All rights reserved.
          </div>
          <div className="mt-2 sm:mt-0 text-[11px] text-slate-400">
            DEMO ENVIRONMENT — PILOT CO-FLAGSHIPS: TAMIL NADU & TELANGANA
          </div>
        </div>
      </div>
    </footer>
  );
};
