import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Layers, 
  Send, 
  FileText, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Calculator, 
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Eye,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { 
  User, 
  Organisation, 
  BuyerRequirement, 
  MarketplaceListing, 
  Enquiry 
} from '../types';

interface DashboardsProps {
  currentUser: User;
  currentOrg: Organisation | null;
  setCurrentView: (view: string) => void;
  onSelectListing: (id: string) => void;
}

export const Dashboards: React.FC<DashboardsProps> = ({
  currentUser,
  currentOrg,
  setCurrentView,
  onSelectListing
}) => {
  const role = currentUser.role;
  const isPlatformAdmin = role === 'PLATFORM_ADMIN' || role === 'VERIFICATION_OFFICER';
  const isSeller = role === 'SELLER_USER' || role === 'SELLER_ADMIN';
  const isBuyer = role === 'BUYER_USER' || role === 'BUYER_ADMIN';

  // Active Tab within dashboard
  const [activeTab, setActiveTab] = useState<'overview' | 'requirements' | 'listings' | 'enquiries' | 'adminReview' | 'audit'>('overview');

  // State data
  const [requirements, setRequirements] = useState<BuyerRequirement[]>([]);
  const [sellerListings, setSellerListings] = useState<MarketplaceListing[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [adminStats, setAdminStats] = useState<any>(null);
  const [reviewQueue, setReviewQueue] = useState<MarketplaceListing[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Message thread modal
  const [activeEnquiry, setActiveEnquiry] = useState<Enquiry | null>(null);
  const [replyMessageText, setReplyMessageText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      if (isBuyer) {
        const [reqs, enqs] = await Promise.all([
          api.getMyRequirements(),
          api.getEnquiries('buyer')
        ]);
        setRequirements(reqs || []);
        setEnquiries(enqs || []);
      } else if (isSeller) {
        const [lists, enqs] = await Promise.all([
          api.getMyListings(),
          api.getEnquiries('seller')
        ]);
        setSellerListings(lists || []);
        setEnquiries(enqs || []);
      } else if (isPlatformAdmin) {
        const [stats, queue, logs] = await Promise.all([
          api.getAdminStats(),
          api.getReviewQueue(),
          api.getAuditLogs(1)
        ]);
        setAdminStats(stats);
        setReviewQueue(queue || []);
        setAuditLogs(logs.data || []);
      }
    } catch (err) {
      console.error("Dashboard data load error", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [role]);

  const handleAdminReview = async (id: string, action: 'APPROVE' | 'REJECT', notes: string) => {
    try {
      await api.reviewListing(id, action, notes);
      alert(`Listing ${action === 'APPROVE' ? 'Published' : 'Rejected'} successfully.`);
      loadDashboardData();
    } catch (err: any) {
      alert(`Review error: ${err.message}`);
    }
  };

  const handleSendReply = async () => {
    if (!activeEnquiry || !replyMessageText.trim()) return;
    setIsSendingReply(true);
    try {
      await api.sendEnquiryMessage(activeEnquiry.id, replyMessageText.trim());
      setReplyMessageText('');
      // Reload enquiry details
      const updated = await api.getEnquiryDetails(activeEnquiry.id);
      setActiveEnquiry(updated);
      loadDashboardData();
    } catch (err: any) {
      alert(`Message error: ${err.message}`);
    } finally {
      setIsSendingReply(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-500 font-semibold mb-1">
            <Building2 className="w-4 h-4 text-teal-600" />
            <span>{currentOrg?.legalName || 'Your Organisation'}</span>
            <span className="text-[10px] bg-teal-100 text-teal-800 px-2 py-0.5 rounded font-bold uppercase">
              {role.replace(/_/g, ' ')}
            </span>
            <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold">
              State: {currentOrg?.registeredState || 'Tamil Nadu'}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-navy-900 brand-font">
            {isBuyer ? 'C&I Power Procurement Workspace' : isSeller ? 'Renewable Developer Asset Console' : 'Platform Operations & Verification Console'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Logged in as <strong>{currentUser.fullName}</strong> ({currentUser.email})
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {isBuyer && (
            <button
              onClick={() => setCurrentView('buy-power')}
              className="bg-teal-600 hover:bg-teal-500 text-navy-900 font-bold px-4 py-2 rounded-xl text-xs transition"
            >
              + Submit New Requirement
            </button>
          )}
          {isSeller && (
            <button
              onClick={() => setCurrentView('sell-power')}
              className="bg-teal-600 hover:bg-teal-500 text-navy-900 font-bold px-4 py-2 rounded-xl text-xs transition"
            >
              + Create Power Listing
            </button>
          )}
          <button
            onClick={loadDashboardData}
            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 transition"
            title="Refresh workspace"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'overview' ? 'bg-navy-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Workspace Overview
        </button>

        {isBuyer && (
          <button
            onClick={() => setActiveTab('requirements')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'requirements' ? 'bg-navy-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            My Requirements ({requirements.length})
          </button>
        )}

        {isSeller && (
          <button
            onClick={() => setActiveTab('listings')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'listings' ? 'bg-navy-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            My Asset Listings ({sellerListings.length})
          </button>
        )}

        <button
          onClick={() => setActiveTab('enquiries')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'enquiries' ? 'bg-navy-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Active Enquiries & RFPs ({enquiries.length})
        </button>

        {isPlatformAdmin && (
          <>
            <button
              onClick={() => setActiveTab('adminReview')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'adminReview' ? 'bg-navy-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Listing Review Queue ({reviewQueue.length})
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'audit' ? 'bg-navy-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              System Audit Trail
            </button>
          </>
        )}
      </div>

      {/* ============================================================
          OVERVIEW TAB
      ============================================================ */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Admin Stats Grid */}
          {isPlatformAdmin && adminStats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 p-5 rounded-2xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Registered Users</span>
                <span className="text-2xl font-black text-navy-900 mt-1 block">{adminStats.totalUsers}</span>
              </div>
              <div className="bg-white border border-slate-200 p-5 rounded-2xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Organisations</span>
                <span className="text-2xl font-black text-navy-900 mt-1 block">{adminStats.totalOrganisations}</span>
              </div>
              <div className="bg-white border border-slate-200 p-5 rounded-2xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Published Capacity</span>
                <span className="text-2xl font-black text-teal-700 mt-1 block">{adminStats.totalCapacityMw} MW</span>
              </div>
              <div className="bg-white border border-slate-200 p-5 rounded-2xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Available for Offtake</span>
                <span className="text-2xl font-black text-teal-600 mt-1 block">{adminStats.availableCapacityMw} MW</span>
              </div>
            </div>
          )}

          {/* Buyer Overview Cards */}
          {isBuyer && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Active Demand Requirements</span>
                <div className="text-2xl font-black text-navy-900">{requirements.length}</div>
                <span className="text-xs text-slate-500">Track matched solar/wind developers</span>
              </div>
              <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Supplier Enquiries In-Flight</span>
                <div className="text-2xl font-black text-teal-700">{enquiries.length}</div>
                <span className="text-xs text-slate-500">Direct negotiations & term sheets</span>
              </div>
              <div className="bg-teal-50 border border-teal-200 p-5 rounded-2xl space-y-2 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-teal-800">Bill-to-Procurement Engine</span>
                  <div className="text-sm font-bold text-teal-950 mt-1">Run 4-Stage Bill Simulation</div>
                </div>
                <button
                  onClick={() => setCurrentView('wizard')}
                  className="bg-navy-900 text-white font-bold py-1.5 px-3 rounded-lg text-xs flex items-center justify-between"
                >
                  <span>Launch Wizard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Seller Overview Cards */}
          {isSeller && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Generation Listings</span>
                <div className="text-2xl font-black text-navy-900">{sellerListings.length}</div>
                <span className="text-xs text-slate-500">Solar, Wind, Hybrid & BESS</span>
              </div>
              <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Buyer RFPs & Inquiries Received</span>
                <div className="text-2xl font-black text-teal-700">{enquiries.length}</div>
                <span className="text-xs text-slate-500">From verified C&I industrial consumers</span>
              </div>
              <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-2 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Verification Status</span>
                  <div className="text-sm font-bold text-teal-800 mt-1 flex items-center space-x-1.5">
                    <ShieldCheck className="w-4 h-4 text-teal-600" />
                    <span>{currentOrg?.verificationStatus.replace(/_/g, ' ') || 'VERIFIED_FOR_STATED_SCOPE'}</span>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400">Grid evacuation & land title verified</span>
              </div>
            </div>
          )}

          {/* Quick Enquiries Preview */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-navy-900 uppercase tracking-wider">
                Recent Enquiry Communications
              </h3>
              <button
                onClick={() => setActiveTab('enquiries')}
                className="text-xs font-bold text-teal-700 hover:underline"
              >
                View All Enquiries
              </button>
            </div>

            {enquiries.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No active enquiries yet.</p>
            ) : (
              <div className="space-y-3">
                {enquiries.slice(0, 3).map(enq => (
                  <div
                    key={enq.id}
                    onClick={async () => {
                      const full = await api.getEnquiryDetails(enq.id);
                      setActiveEnquiry(full);
                    }}
                    className="p-3.5 rounded-xl border border-slate-100 hover:border-teal-400 cursor-pointer transition flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold text-navy-900">{enq.listing.title}</div>
                      <div className="text-slate-500 text-[11px]">
                        With: <strong>{isBuyer ? enq.sellerOrganisation.legalName : enq.buyerOrganisation.legalName}</strong>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-teal-50 text-teal-800 uppercase">
                        {enq.status}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {new Date(enq.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================
          BUYER REQUIREMENTS TAB
      ============================================================ */}
      {activeTab === 'requirements' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-navy-900 brand-font">Submitted Power Requirements</h2>
            <button
              onClick={() => setCurrentView('buy-power')}
              className="bg-navy-900 text-white font-bold px-4 py-2 rounded-xl text-xs"
            >
              + Submit New Requirement
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {requirements.map(req => (
              <div key={req.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 font-bold">{req.requirementCode}</span>
                    <h3 className="text-base font-bold text-navy-900 brand-font">{req.title}</h3>
                    <div className="text-xs text-slate-500 mt-0.5">
                      State: <strong className="text-slate-800">{req.state} ({req.discomName})</strong> | Industry: <strong className="text-slate-800">{req.industryType}</strong>
                    </div>
                  </div>
                  <span className="bg-teal-50 text-teal-800 px-2.5 py-1 rounded text-xs font-bold uppercase">
                    {req.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3 rounded-xl">
                  <div>
                    <span className="text-slate-400 text-[10px] block font-bold uppercase">Contract Demand</span>
                    <span className="font-extrabold text-navy-900">{req.contractDemandKva} kVA (~{(req.contractDemandKva / 1000).toFixed(1)} MW)</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block font-bold uppercase">Monthly Consumption</span>
                    <span className="font-bold text-slate-800">{(req.monthlyConsumptionKwh / 1000000).toFixed(2)} MU</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block font-bold uppercase">Current Landed</span>
                    <span className="font-bold text-slate-800">₹{req.currentSupplyCostPerKwh?.toFixed(2) || '8.75'}/u</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block font-bold uppercase">Green Share Goal</span>
                    <span className="font-bold text-teal-700">{req.targetRenewablePercent}%</span>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    onClick={() => setCurrentView('wizard')}
                    className="bg-teal-600 hover:bg-teal-500 text-navy-900 font-bold px-4 py-1.5 rounded-lg text-xs"
                  >
                    View Matches in Wizard
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================
          SELLER LISTINGS TAB
      ============================================================ */}
      {activeTab === 'listings' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-navy-900 brand-font">Registered Generation Assets</h2>
            <button
              onClick={() => setCurrentView('sell-power')}
              className="bg-navy-900 text-white font-bold px-4 py-2 rounded-xl text-xs"
            >
              + Create New Listing
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {sellerListings.map(listing => (
              <div key={listing.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 font-bold">{listing.listingCode}</span>
                    <h3 
                      onClick={() => onSelectListing(listing.id)}
                      className="text-base font-bold text-navy-900 hover:text-teal-600 cursor-pointer brand-font"
                    >
                      {listing.title}
                    </h3>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Location: <strong className="text-slate-800">{listing.projectLocation}</strong> ({listing.interconnectionType.replace(/_/g, ' ')})
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="bg-teal-50 text-teal-800 px-2.5 py-1 rounded text-xs font-bold uppercase block">
                      {listing.status}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1 block">{listing.viewCount} Views</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3 rounded-xl">
                  <div>
                    <span className="text-slate-400 text-[10px] block font-bold uppercase">Total Capacity</span>
                    <span className="font-extrabold text-navy-900">{listing.totalCapacityMw} MW</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block font-bold uppercase">Available Offtake</span>
                    <span className="font-extrabold text-teal-700">{listing.availableCapacityMw} MW</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block font-bold uppercase">Indicative Tariff</span>
                    <span className="font-bold text-slate-800">₹{listing.indicativePricePerKwh?.toFixed(2) || 'Custom'}/u</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block font-bold uppercase">Readiness</span>
                    <span className="font-bold text-slate-800">{listing.projectStatus}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================
          ENQUIRIES TAB
      ============================================================ */}
      {activeTab === 'enquiries' && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-navy-900 brand-font">Enquiry Threads & Term Sheets</h2>

          <div className="space-y-3">
            {enquiries.map(enq => (
              <div
                key={enq.id}
                onClick={async () => {
                  const full = await api.getEnquiryDetails(enq.id);
                  setActiveEnquiry(full);
                }}
                className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-teal-400 cursor-pointer shadow-sm transition space-y-2"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 font-bold">{enq.enquiryCode}</span>
                    <h3 className="text-sm font-bold text-navy-900 brand-font">{enq.listing.title}</h3>
                    <div className="text-xs text-slate-500">
                      Counterparty: <strong className="text-slate-800">{isBuyer ? enq.sellerOrganisation.legalName : enq.buyerOrganisation.legalName}</strong>
                    </div>
                  </div>
                  <span className="bg-teal-50 text-teal-800 px-2 py-0.5 rounded text-[11px] font-bold uppercase">
                    {enq.status}
                  </span>
                </div>

                <div className="text-xs text-slate-600 line-clamp-2 bg-slate-50 p-2.5 rounded-lg">
                  "{enq.message}"
                </div>

                <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1">
                  <span>Capacity: {enq.proposedCapacityMw ? `${enq.proposedCapacityMw} MW` : 'Custom'}</span>
                  <span className="text-teal-700 font-bold">Open Conversation Thread &rarr;</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================
          ADMIN REVIEW QUEUE TAB
      ============================================================ */}
      {isPlatformAdmin && activeTab === 'adminReview' && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-navy-900 brand-font">Listings Pending Verification & Approval</h2>

          {reviewQueue.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 text-xs">
              Review queue is clear! All submitted listings have been moderated.
            </div>
          ) : (
            <div className="space-y-4">
              {reviewQueue.map(item => (
                <div key={item.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 font-bold">{item.listingCode}</span>
                      <h3 className="text-base font-bold text-navy-900">{item.title}</h3>
                      <div className="text-xs text-slate-500">
                        Developer: <strong className="text-slate-800">{item.organisation.legalName}</strong> | State: {item.state}
                      </div>
                    </div>
                    <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-xs font-bold uppercase">
                      {item.status}
                    </span>
                  </div>

                  <div className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl space-y-1">
                    <div>Capacity: <strong>{item.availableCapacityMw} MW available</strong> of {item.totalCapacityMw} MW</div>
                    <div>Model: <strong>{item.commercialModel}</strong> | Tariff: <strong>₹{item.indicativePricePerKwh}/kWh</strong></div>
                    <div>Approvals claimed: {item.regulatoryApprovals || 'None specified'}</div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleAdminReview(item.id, 'REJECT', 'Additional CEIG or grid connectivity documents required.')}
                      className="bg-red-50 hover:bg-red-100 text-red-700 font-bold px-4 py-2 rounded-xl text-xs transition"
                    >
                      Reject Draft
                    </button>
                    <button
                      onClick={() => handleAdminReview(item.id, 'APPROVE', 'Verified against submitted grid interconnection sanction.')}
                      className="bg-teal-600 hover:bg-teal-500 text-navy-900 font-bold px-5 py-2 rounded-xl text-xs transition"
                    >
                      Approve & Publish to Explorer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================
          SYSTEM AUDIT TRAIL TAB
      ============================================================ */}
      {isPlatformAdmin && activeTab === 'audit' && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-navy-900 brand-font">Immutable System Audit Logs</h2>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="py-2.5 px-4 font-bold">Timestamp</th>
                  <th className="py-2.5 px-4 font-bold">Action</th>
                  <th className="py-2.5 px-4 font-bold">Entity</th>
                  <th className="py-2.5 px-4 font-bold">User / Org</th>
                  <th className="py-2.5 px-4 font-bold">Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {auditLogs.map(log => (
                  <tr key={log.id}>
                    <td className="py-2 px-4 text-slate-400 font-mono text-[11px]">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2 px-4 font-bold text-teal-800">{log.action}</td>
                    <td className="py-2 px-4">{log.entityName}</td>
                    <td className="py-2 px-4 font-medium">{log.user?.fullName || log.organisation?.legalName || 'System'}</td>
                    <td className="py-2 px-4 text-[10px] text-slate-500 font-mono max-w-xs truncate">{log.metadata || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Enquiry Conversation Modal */}
      {activeEnquiry && (
        <div className="fixed inset-0 z-50 bg-navy-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-4 shadow-2xl relative flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-start pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-mono text-slate-400 font-bold">{activeEnquiry.enquiryCode}</span>
                <h3 className="text-base font-bold text-navy-900 brand-font">{activeEnquiry.listing.title}</h3>
                <div className="text-xs text-slate-500">
                  Buyer: {activeEnquiry.buyerOrganisation.legalName} | Seller: {activeEnquiry.sellerOrganisation.legalName}
                </div>
              </div>
              <button
                onClick={() => setActiveEnquiry(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto space-y-3 p-2 bg-slate-50 rounded-xl border border-slate-200">
              {activeEnquiry.messages?.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl text-xs max-w-[85%] ${
                    msg.senderOrgId === currentOrg?.id
                      ? 'ml-auto bg-navy-900 text-white'
                      : 'mr-auto bg-white border border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="font-bold text-[10px] opacity-75 mb-1">{msg.senderName}</div>
                  <p className="leading-relaxed">{msg.messageText}</p>
                  <span className="text-[9px] opacity-60 block mt-1 text-right">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>

            {/* Reply Input */}
            <div className="pt-2 flex gap-2">
              <input
                type="text"
                value={replyMessageText}
                onChange={(e) => setReplyMessageText(e.target.value)}
                placeholder="Type response regarding term sheet, interconnection, or pricing..."
                className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
              />
              <button
                onClick={handleSendReply}
                disabled={isSendingReply || !replyMessageText.trim()}
                className="bg-teal-600 hover:bg-teal-500 text-navy-900 font-bold px-4 py-2 rounded-xl text-xs transition disabled:opacity-50 flex items-center space-x-1"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
