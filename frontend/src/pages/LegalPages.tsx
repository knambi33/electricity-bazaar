import React from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  FileText, 
  Mail, 
  MapPin, 
  Phone, 
  Scale, 
  Lock,
  Zap,
  Building2
} from 'lucide-react';

interface LegalPagesProps {
  section: 'about' | 'contact' | 'terms' | 'privacy' | 'disclaimer' | 'grievance';
  setCurrentView: (view: string) => void;
}

export const LegalPages: React.FC<LegalPagesProps> = ({ section, setCurrentView }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Subnav for Legal pages */}
      <div className="flex flex-wrap gap-2 pb-4 border-b border-slate-200 text-xs">
        {[
          { id: 'legal-about', label: 'About Us', active: section === 'about' },
          { id: 'legal-disclaimer', label: 'Regulatory Boundaries & Disclaimer', active: section === 'disclaimer' },
          { id: 'legal-terms', label: 'Terms of Use', active: section === 'terms' },
          { id: 'legal-privacy', label: 'Privacy & Data Consent', active: section === 'privacy' },
          { id: 'legal-contact', label: 'Contact', active: section === 'contact' },
          { id: 'legal-grievance', label: 'Grievance Officer', active: section === 'grievance' }
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id)}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              item.active ? 'bg-navy-900 text-teal-300' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* ================= ABOUT US ================= */}
      {section === 'about' && (
        <div className="space-y-6 text-slate-700 text-xs leading-relaxed">
          <div>
            <h1 className="text-3xl font-extrabold text-navy-900 brand-font mb-2">About Electricity Bazaar</h1>
            <p className="text-sm font-semibold text-teal-700">India's Marketplace for Electricity & Energy Solutions</p>
          </div>

          <p>
            <strong>Electricity Bazaar (ElectricityBazaar.in)</strong> is a specialized B2B digital marketplace and procurement intelligence platform engineered for commercial and industrial (C&I) electricity consumers, renewable energy developers, captive generators, and storage operators across India.
          </p>

          <h3 className="text-sm font-bold text-navy-900 pt-2">Our Mission</h3>
          <p>
            To transform industrial electricity procurement from fragmented offline brokerage into a transparent, data-driven, and legally credible process. We enable consumers to deconstruct their utility bills, simulate state SERC open access economics, discover pre-vetted generation capacity, and connect with developers with total confidence.
          </p>

          <h3 className="text-sm font-bold text-navy-900 pt-2">Flagship Dual Pilot</h3>
          <p>
            The platform is initially launched with deep regulatory integration in <strong>Tamil Nadu (TNERC / TANGEDCO)</strong> and <strong>Telangana (TSERC / TSSPDCL)</strong>, before scaling across Gujarat, Rajasthan, Maharashtra, and pan-India.
          </p>
        </div>
      )}

      {/* ================= REGULATORY DISCLAIMER ================= */}
      {section === 'disclaimer' && (
        <div className="space-y-6 text-slate-700 text-xs leading-relaxed">
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-start space-x-3">
            <ShieldAlert className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-bold text-amber-900 uppercase tracking-wider mb-1">
                Statutory Regulatory Notice & Platform Stance
              </h2>
              <p className="text-amber-800 text-[11px] leading-relaxed">
                Electricity Bazaar is strictly an informational discovery, landed-cost modeling, and matchmaking venue.
              </p>
            </div>
          </div>

          <h3 className="text-sm font-bold text-navy-900 pt-2">1. Not an Electricity Trading Licensee or Exchange</h3>
          <p>
            Electricity Bazaar is <strong>not</strong> an electricity trader licensed under Section 14 of the Electricity Act, 2003, and is <strong>not</strong> an authorized power exchange under the CERC (Power Market) Regulations. The platform does not clear trades, take title to electricity, execute dispatch scheduling on SLDC/RLDC grids, collect trading margins, or guarantee physical power supply.
          </p>

          <h3 className="text-sm font-bold text-navy-900 pt-2">2. Bilateral Agreements & Regulatory Approvals</h3>
          <p>
            Any power offtake, Power Purchase Agreement (PPA), or equity participation under Group Captive arrangements (Electricity Rules 2005 Rule 3) is executed bilaterally between the buyer and seller. All transactions remain subject to statutory filings, open access sanctions, CEIG inspections, and tariff orders issued by respective State Electricity Regulatory Commissions (such as TNERC in Tamil Nadu and TSERC in Telangana).
          </p>

          <h3 className="text-sm font-bold text-navy-900 pt-2">3. Indicative Calculations</h3>
          <p>
            Calculations generated by the Procurement Economics Calculator are indicative estimates based on prevailing published tariff orders. Actual landed costs will vary based on transmission line losses, meter drawal voltage, contracted maximum demand (CMD), TOD penalties, and semi-annual fuel/additional surcharges.
          </p>
        </div>
      )}

      {/* ================= TERMS OF USE ================= */}
      {section === 'terms' && (
        <div className="space-y-6 text-slate-700 text-xs leading-relaxed">
          <h1 className="text-2xl font-bold text-navy-900 brand-font">Terms of Use</h1>
          <p className="text-slate-500">Effective Date: October 14, 2026</p>

          <h3 className="text-sm font-bold text-navy-900">1. Eligibility</h3>
          <p>
            Access is intended exclusively for incorporated commercial and industrial entities, registered clean energy developers, licensed contractors, and authorized consultants.
          </p>

          <h3 className="text-sm font-bold text-navy-900">2. Accuracy of Submitted Data</h3>
          <p>
            Sellers represent and warrant that listing details—including available capacity, grid interconnection status, and regulatory approvals—are factual and substantiated by documentation.
          </p>

          <h3 className="text-sm font-bold text-navy-900">3. Demonstration Content</h3>
          <p>
            Records labelled "DEMO DATA — NOT A REAL OFFER" are provided for system demonstration and benchmarking purposes only and do not constitute binding commercial offers.
          </p>
        </div>
      )}

      {/* ================= PRIVACY POLICY ================= */}
      {section === 'privacy' && (
        <div className="space-y-6 text-slate-700 text-xs leading-relaxed">
          <h1 className="text-2xl font-bold text-navy-900 brand-font">Privacy & Commercial Data Safeguards</h1>
          <p className="text-slate-500">Effective Date: October 14, 2026</p>

          <h3 className="text-sm font-bold text-navy-900">1. Buyer Load Confidentiality</h3>
          <p>
            We strictly safeguard confidential customer electricity bill records, hourly load shapes, contracted maximum demand figures, and existing landed power tariffs. These records are never exposed on public explorer pages.
          </p>

          <h3 className="text-sm font-bold text-navy-900">2. Consent-Gated Transmission</h3>
          <p>
            A buyer's identity and specific facility load demand are shared with a developer counterparty only when the buyer explicitly initiates or consents to an enquiry thread.
          </p>

          <h3 className="text-sm font-bold text-navy-900">3. Data Retention & Document Storage</h3>
          <p>
            Corporate verification documents and grid sanction letters are stored in private, encrypted object storage with time-limited presigned URL access.
          </p>
        </div>
      )}

      {/* ================= CONTACT ================= */}
      {section === 'contact' && (
        <div className="space-y-6 text-slate-700 text-xs leading-relaxed">
          <h1 className="text-2xl font-bold text-navy-900 brand-font">Contact Advisory & Support</h1>
          <p>
            Our dedicated power sector advisory team is available to assist industrial consumers and developers with onboarding and procurement simulations.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2">
              <span className="font-bold text-navy-900 text-sm flex items-center space-x-1.5">
                <Mail className="w-4 h-4 text-teal-600" />
                <span>Email Enquiries</span>
              </span>
              <p className="text-slate-600">procurement@electricitybazaar.in</p>
              <p className="text-slate-600">support@electricitybazaar.in</p>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2">
              <span className="font-bold text-navy-900 text-sm flex items-center space-x-1.5">
                <MapPin className="w-4 h-4 text-teal-600" />
                <span>Regional Offices</span>
              </span>
              <p className="text-slate-600">Chennai: Guindy Industrial Estate, Tamil Nadu</p>
              <p className="text-slate-600">Hyderabad: HITEC City, Telangana</p>
            </div>
          </div>
        </div>
      )}

      {/* ================= GRIEVANCE OFFICER ================= */}
      {section === 'grievance' && (
        <div className="space-y-6 text-slate-700 text-xs leading-relaxed">
          <h1 className="text-2xl font-bold text-navy-900 brand-font">Grievance Redressal Officer</h1>
          <p>
            In compliance with the Information Technology Act 2000 and applicable intermediary guidelines, the Grievance Officer details are published below:
          </p>

          <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
            <div>Officer Name: <strong>R. Chandrasekar</strong></div>
            <div>Designation: <strong>Director - Legal & Regulatory Compliance</strong></div>
            <div>Organisation: <strong>Electricity Bazaar Operations Pvt Ltd</strong></div>
            <div>Email: <strong>grievance@electricitybazaar.in</strong></div>
            <div>Response Time: Acknowledged within 24 hours, resolved within 15 days.</div>
          </div>
        </div>
      )}
    </div>
  );
};
