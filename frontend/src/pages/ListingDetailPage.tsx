import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  ShieldCheck, 
  Zap, 
  MapPin, 
  Calendar, 
  Clock, 
  FileText, 
  CheckCircle2, 
  Send, 
  Layers, 
  AlertTriangle,
  Building2,
  Share2,
  ExternalLink,
  DollarSign,
  Cpu
} from 'lucide-react';
import { api } from '../services/api';
import { MarketplaceListing } from '../types';

interface ListingDetailPageProps {
  listingId: string;
  onBack: () => void;
  setCurrentView: (view: string) => void;
  onSelectListing: (id: string) => void;
}

export const ListingDetailPage: React.FC<ListingDetailPageProps> = ({
  listingId,
  onBack,
  setCurrentView,
  onSelectListing
}) => {
  const [listing, setListing] = useState<MarketplaceListing | null>(null);
  const [similarListings, setSimilarListings] = useState<MarketplaceListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Enquiry Modal state
  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false);
  const [enquiryCapacityMw, setEnquiryCapacityMw] = useState<number>(5.0);
  const [enquiryMessage, setEnquiryMessage] = useState('');
  const [enquiryConsent, setEnquiryConsent] = useState(true);
  const [isSubmittingEnquiry, setIsSubmittingEnquiry] = useState(false);
  const [enquirySuccess, setEnquirySuccess] = useState(false);

  useEffect(() => {
    async function loadDetails() {
      setIsLoading(true);
      try {
        const data = await api.getListingDetails(listingId);
        setListing(data);
        if (data.availableCapacityMw) {
          setEnquiryCapacityMw(Math.min(5.0, data.availableCapacityMw));
        }

        // Fetch similar listings in same state or category
        const similar = await api.getListings({
          state: data.state,
          limit: '3'
        });
        setSimilarListings(similar.data.filter(l => l.id !== data.id));
      } catch (err) {
        console.error("Failed to load listing details", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDetails();
  }, [listingId]);

  const handleSubmitEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listing) return;

    setIsSubmittingEnquiry(true);
    try {
      await api.createEnquiry({
        listingId: listing.id,
        proposedCapacityMw: enquiryCapacityMw,
        message: enquiryMessage || `Procurement enquiry regarding ${listing.title} (${listing.listingCode}). We seek an indicative PPA term sheet and connection schedule.`,
        buyerConsentGranted: enquiryConsent
      });

      setEnquirySuccess(true);
    } catch (err: any) {
      alert(`Enquiry note: ${err.message || 'Please sign in to send inquiries'}`);
      if (!localStorage.getItem('eb_token')) {
        setCurrentView('login');
      }
    } finally {
      setIsSubmittingEnquiry(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-xs text-slate-500 font-semibold">Loading technical project specification...</p>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-navy-900">Listing Not Found</h2>
        <p className="text-xs text-slate-500">The requested opportunity is unavailable or expired.</p>
        <button
          onClick={onBack}
          className="bg-navy-900 text-white px-5 py-2 rounded-xl text-xs font-bold"
        >
          Return to Explorer
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button */}
      <div>
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-navy-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Marketplace</span>
        </button>
      </div>

      {/* Main Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded uppercase">
                DEMO DATA — NOT A REAL OFFER
              </span>
              <span className="text-xs font-mono font-bold text-slate-500">
                {listing.listingCode}
              </span>
              <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded flex items-center space-x-1 border border-teal-200">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                <span>{listing.organisation.verificationStatus.replace(/_/g, ' ')}</span>
              </span>
              <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded font-semibold">
                {listing.category.replace(/_/g, ' ')}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 brand-font leading-tight">
              {listing.title}
            </h1>

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-600">
              <span className="flex items-center space-x-1.5">
                <Building2 className="w-4 h-4 text-slate-400" />
                <span>Developer: <strong className="text-slate-900">{listing.organisation.legalName}</strong></span>
              </span>
              <span className="flex items-center space-x-1.5">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span>Location: <strong className="text-slate-900">{listing.projectLocation}</strong></span>
              </span>
              <span className="flex items-center space-x-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Availability: <strong className="text-slate-900">{new Date(listing.expectedAvailabilityDate).toLocaleDateString()}</strong></span>
              </span>
            </div>
          </div>

          {/* Pricing & CTA Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 min-w-[260px] flex flex-col justify-between space-y-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Indicative Generation Tariff
              </span>
              <div className="text-3xl font-black text-navy-900 brand-font mt-0.5">
                {listing.indicativePricePerKwh ? (
                  <>
                    ₹{listing.indicativePricePerKwh.toFixed(2)}
                    <span className="text-xs font-normal text-slate-500"> / kWh</span>
                  </>
                ) : (
                  <span className="text-xl">Custom RFP</span>
                )}
              </div>
              <span className="text-[11px] text-teal-700 font-semibold block mt-1">
                {listing.commercialModel === 'GROUP_CAPTIVE' ? '✓ 0 CSS under Group Captive' : 'Open Access Charges Extra'}
              </span>
            </div>

            <button
              onClick={() => setEnquiryModalOpen(true)}
              className="w-full bg-teal-600 hover:bg-teal-500 text-navy-900 font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 transition shadow-md shadow-teal-600/20"
            >
              <Send className="w-4 h-4" />
              <span>Contact Developer / Send RFP</span>
            </button>
          </div>
        </div>

        {/* Technical Highlights Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100 text-xs">
          <div className="bg-slate-50 p-3.5 rounded-xl">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Available Capacity</span>
            <span className="text-base font-extrabold text-teal-700">
              {listing.availableCapacityMw} MW <span className="text-xs font-normal text-slate-400">/ {listing.totalCapacityMw} MW Total</span>
            </span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Commercial Structure</span>
            <span className="text-sm font-bold text-slate-800">
              {listing.commercialModel.replace(/_/g, ' ')}
            </span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Interconnection Grid</span>
            <span className="text-sm font-bold text-slate-800">
              {listing.interconnectionType.replace(/_/g, ' ')}
            </span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Plant Status</span>
            <span className="text-sm font-bold text-slate-800">
              {listing.projectStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Detailed Specifications Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Technical & Commercial Specs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Renewable Assets Specifics */}
          {listing.renewableDetails && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
              <h3 className="text-base font-bold text-navy-900 brand-font flex items-center space-x-2">
                <Zap className="w-4 h-4 text-teal-600" />
                <span>Renewable Asset Engineering Specifications</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-500 block text-[11px]">Generation Technology</span>
                  <span className="font-bold text-slate-800">{listing.renewableDetails.technology}</span>
                </div>
                {listing.renewableDetails.cuFactorPercent && (
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-500 block text-[11px]">Capacity Utilisation Factor (CUF)</span>
                    <span className="font-bold text-slate-800">{listing.renewableDetails.cuFactorPercent}%</span>
                  </div>
                )}
                {listing.renewableDetails.expectedAnnualGenMu && (
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-500 block text-[11px]">Annual Generation Estimate</span>
                    <span className="font-bold text-slate-800">{listing.renewableDetails.expectedAnnualGenMu} Million Units (MUs)</span>
                  </div>
                )}
                {listing.renewableDetails.dcAcRatio && (
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-500 block text-[11px]">DC / AC Overloading Ratio</span>
                    <span className="font-bold text-slate-800">{listing.renewableDetails.dcAcRatio}x</span>
                  </div>
                )}
              </div>

              {listing.renewableDetails.captiveStructureInfo && (
                <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-900">
                  <strong className="block mb-1 text-teal-950 font-bold">Group Captive Statutory Structure (Electricity Rules 2005 Rule 3):</strong>
                  {listing.renewableDetails.captiveStructureInfo}
                </div>
              )}
            </div>
          )}

          {/* Storage Asset Specifics */}
          {listing.storageDetails && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
              <h3 className="text-base font-bold text-navy-900 brand-font flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-teal-600" />
                <span>Energy Storage System (BESS / PSP) Parameters</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-500 block text-[11px]">Power Capacity</span>
                  <span className="font-extrabold text-navy-900">{listing.storageDetails.powerCapacityMw} MW</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-500 block text-[11px]">Energy Capacity</span>
                  <span className="font-extrabold text-navy-900">{listing.storageDetails.energyCapacityMwh} MWh</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-500 block text-[11px]">Discharge Duration</span>
                  <span className="font-bold text-slate-800">{listing.storageDetails.durationHours} Hours</span>
                </div>
                {listing.storageDetails.roundTripEfficiencyPct && (
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-500 block text-[11px]">Round-Trip Efficiency (RTE)</span>
                    <span className="font-bold text-teal-700">{listing.storageDetails.roundTripEfficiencyPct}%</span>
                  </div>
                )}
                {listing.storageDetails.commercialPricingModel && (
                  <div className="p-3 bg-slate-50 rounded-xl sm:col-span-2">
                    <span className="text-slate-500 block text-[11px]">Storage Service Model</span>
                    <span className="font-bold text-slate-800">{listing.storageDetails.commercialPricingModel}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Pricing & Commercial Conditions */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
            <h3 className="text-base font-bold text-navy-900 brand-font">Commercial Terms & Escalation Framework</h3>
            <div className="space-y-3 text-xs leading-relaxed text-slate-700">
              <p>
                <strong>Price Basis & Substation Interface:</strong> {listing.priceBasisConditions || 'Ex-busbar at plant switchyard. Wheeling and transmission losses are payable by the drawing consumer.'}
              </p>
              <p>
                <strong>Contract Duration:</strong> {listing.contractDurationYears ? `${listing.contractDurationYears} Years long-term PPA` : 'Negotiable bilateral term'}.
              </p>
              {listing.substationDetails && (
                <p>
                  <strong>Evacuation Substation:</strong> {listing.substationDetails}
                </p>
              )}
              {listing.regulatoryApprovals && (
                <p>
                  <strong>Regulatory Approvals:</strong> {listing.regulatoryApprovals}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Trust & Verification Scope + Similar Opportunities */}
        <div className="space-y-6">
          {/* Verification Scope */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-center space-x-2 text-teal-800 font-bold text-xs uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>Platform Verification Scope</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {listing.organisation.verificationNotes || 'Developer credentials, corporate registration, and in-principle grid connectivity letters have been verified by Electricity Bazaar compliance officers.'}
            </p>
            <div className="pt-2 text-[11px] text-slate-500 border-t border-slate-200">
              Note: Verification confirms document submission and does not constitute a state regulatory license or supply guarantee.
            </div>
          </div>

          {/* Similar Opportunities in Same State */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-sm">
            <h4 className="text-xs font-bold uppercase tracking-wider text-navy-900">
              Similar Opportunities in {listing.state}
            </h4>
            <div className="space-y-3">
              {similarListings.map(sim => (
                <div
                  key={sim.id}
                  onClick={() => onSelectListing(sim.id)}
                  className="p-3 rounded-xl border border-slate-100 hover:border-teal-400 transition cursor-pointer text-xs space-y-1"
                >
                  <div className="font-bold text-slate-800 truncate">{sim.title}</div>
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>{sim.availableCapacityMw} MW available</span>
                    <span className="font-bold text-teal-600">
                      {sim.indicativePricePerKwh ? `₹${sim.indicativePricePerKwh.toFixed(2)}/u` : 'Custom'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Direct Enquiry Modal */}
      {enquiryModalOpen && (
        <div className="fixed inset-0 z-50 bg-navy-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl relative">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold text-teal-600 uppercase tracking-wider">Procurement RFP</span>
                <h3 className="text-lg font-bold text-navy-900 brand-font mt-0.5">
                  Connect with {listing.organisation.legalName}
                </h3>
              </div>
              <button
                onClick={() => setEnquiryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
              >
                &times;
              </button>
            </div>

            {enquirySuccess ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-teal-600 mx-auto" />
                <h4 className="text-base font-bold text-navy-900">Enquiry Transmitted Successfully</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Your enquiry has been delivered to the developer. You will receive term sheet updates in your buyer dashboard.
                </p>
                <button
                  onClick={() => {
                    setEnquiryModalOpen(false);
                    setEnquirySuccess(false);
                  }}
                  className="bg-navy-900 text-white text-xs font-bold px-6 py-2.5 rounded-xl"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitEnquiry} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Requested Capacity (MW)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    max={listing.availableCapacityMw}
                    value={enquiryCapacityMw}
                    onChange={(e) => setEnquiryCapacityMw(parseFloat(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Available on this plant: {listing.availableCapacityMw} MW
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Message / Term Sheet Specifications
                  </label>
                  <textarea
                    rows={3}
                    value={enquiryMessage}
                    onChange={(e) => setEnquiryMessage(e.target.value)}
                    placeholder={`We are an HT industrial consumer in ${listing.state} looking to off-take ${enquiryCapacityMw} MW under ${listing.commercialModel.replace(/_/g, ' ')}. Please provide indicative PPA terms and connectivity timeline.`}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-start space-x-2 pt-1 text-[11px] text-slate-600">
                  <input
                    type="checkbox"
                    id="modalConsent"
                    checked={enquiryConsent}
                    onChange={(e) => setEnquiryConsent(e.target.checked)}
                    className="accent-teal-600 rounded mt-0.5"
                  />
                  <label htmlFor="modalConsent">
                    I grant consent to share our facility state ({listing.state}) and capacity demand ({enquiryCapacityMw} MW) with {listing.organisation.legalName}.
                  </label>
                </div>

                <div className="pt-3 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setEnquiryModalOpen(false)}
                    className="bg-slate-100 text-slate-700 font-semibold px-4 py-2 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingEnquiry || !enquiryConsent}
                    className="bg-teal-600 hover:bg-teal-500 text-navy-900 font-bold px-6 py-2 rounded-xl flex items-center space-x-1.5 transition disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmittingEnquiry ? 'Sending...' : 'Transmit Enquiry'}</span>
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
