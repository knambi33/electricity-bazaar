import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Calendar, 
  ExternalLink, 
  Building2, 
  Search, 
  Filter, 
  Clock, 
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { TenderOpportunity } from '../types';

export const TendersPage: React.FC = () => {
  const [tenders, setTenders] = useState<TenderOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedType, setSelectedType] = useState('');

  useEffect(() => {
    async function loadTenders() {
      setIsLoading(true);
      try {
        const params: Record<string, string> = {};
        if (selectedType) params.tenderType = selectedType;
        if (searchKeyword.trim()) params.search = searchKeyword.trim();

        const data = await api.getTenders(params);
        setTenders(data || []);
      } catch (err) {
        console.error("Tenders fetch error", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadTenders();
  }, [selectedType, searchKeyword]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-teal-600 uppercase tracking-wider mb-1">
          <FileText className="w-4 h-4" />
          <span>Government & Utility Tenders</span>
        </div>
        <h1 className="text-3xl font-extrabold text-navy-900 brand-font">
          Energy Procurement & Infrastructure Tenders
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">
          Aggregated and verified tenders from central and state utilities including SECI, NTPC, TANGEDCO (Tamil Nadu), TSSPDCL (Telangana), GUVNL, and SJVN. Deadlines displayed in Asia/Kolkata timezone.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="Search by tender title, authority, or reference number..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>

        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
        >
          <option value="">All Tender Types</option>
          <option value="POWER_PROCUREMENT">Power Procurement</option>
          <option value="RENEWABLE_ENERGY">Renewable Energy</option>
          <option value="BESS_STORAGE">BESS Battery Storage</option>
          <option value="SOLAR_EPC">Solar EPC</option>
        </select>
      </div>

      {/* Tenders List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 bg-slate-100 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : tenders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 text-xs">
          No active tenders matching the specified query.
        </div>
      ) : (
        <div className="space-y-4">
          {tenders.map(tender => (
            <div
              key={tender.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-teal-400 hover:shadow-md transition flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-[10px]">
                  <span className="font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded uppercase">
                    DEMO DATA
                  </span>
                  <span className="font-mono text-slate-400 font-bold">{tender.tenderRefNo}</span>
                  <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold">
                    {tender.tenderType.replace(/_/g, ' ')}
                  </span>
                  <span className="bg-teal-50 text-teal-700 px-2 py-0.5 rounded font-bold">
                    {tender.state}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-navy-900 brand-font">
                  {tender.title}
                </h3>

                <div className="text-xs text-slate-500 flex flex-wrap gap-x-4">
                  <span>Issuing Body: <strong className="text-slate-800">{tender.issuingAuthority}</strong></span>
                  {tender.capacityMw && (
                    <span>Capacity: <strong className="text-teal-700">{tender.capacityMw} MW</strong></span>
                  )}
                  {tender.estimatedValueInr && (
                    <span>Est. Value: <strong className="text-slate-800">₹{(tender.estimatedValueInr / 100).toFixed(2)} Cr</strong></span>
                  )}
                </div>
              </div>

              <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 space-y-2 min-w-[180px]">
                <div className="flex items-center space-x-1.5 text-xs text-slate-600">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>
                    Due: <strong>{new Date(tender.submissionDeadline).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}</strong>
                  </span>
                </div>

                <a
                  href={tender.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-navy-900 hover:bg-navy-800 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition"
                >
                  <span>Official Source</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
