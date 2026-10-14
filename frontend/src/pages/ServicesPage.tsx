import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  ShieldCheck, 
  MapPin, 
  ArrowRight, 
  Send, 
  Search, 
  CheckCircle2,
  Building2
} from 'lucide-react';
import { api } from '../services/api';
import { ServiceListing } from '../types';

export const ServicesPage: React.FC = () => {
  const [services, setServices] = useState<ServiceListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    async function loadServices() {
      setIsLoading(true);
      try {
        const params: Record<string, string> = {};
        if (selectedCategory) params.category = selectedCategory;
        if (searchKeyword.trim()) params.search = searchKeyword.trim();

        const data = await api.getServices(params);
        setServices(data || []);
      } catch (err) {
        console.error("Services fetch error", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadServices();
  }, [selectedCategory, searchKeyword]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-teal-600 uppercase tracking-wider mb-1">
          <Briefcase className="w-4 h-4" />
          <span>Professional Power Advisory & Engineering</span>
        </div>
        <h1 className="text-3xl font-extrabold text-navy-900 brand-font">
          Energy Services & Turnkey Solutions Directory
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">
          Connect with verified consultants and contractors for Open Access regulatory filings, group captive equity audits, CEIG approvals, solar EPC, and energy audits.
        </p>
      </div>

      {/* Services List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="h-40 bg-slate-100 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : services.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 text-xs">
          No services matching current filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {services.map(srv => (
            <div
              key={srv.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 hover:border-teal-400 hover:shadow-lg transition flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded uppercase">
                    DEMO DATA
                  </span>
                  <span className="font-mono text-slate-400 font-bold">{srv.serviceCode}</span>
                  <span className="bg-teal-50 text-teal-800 font-bold px-2 py-0.5 rounded border border-teal-200 flex items-center space-x-1">
                    <ShieldCheck className="w-3 h-3 text-teal-600" />
                    <span>{srv.organisation.verificationStatus.replace(/_/g, ' ')}</span>
                  </span>
                </div>

                <h3 className="text-base font-bold text-navy-900 brand-font">
                  {srv.title}
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {srv.description}
                </p>

                <div className="text-xs text-slate-500 space-y-1 pt-2">
                  <div>Consultant: <strong className="text-slate-800">{srv.organisation.legalName}</strong></div>
                  <div>Coverage: <strong className="text-slate-800">{srv.geographicalCoverage}</strong></div>
                  {srv.qualifications && (
                    <div>Credentials: <strong className="text-slate-800">{srv.qualifications}</strong></div>
                  )}
                  {srv.pricingModel && (
                    <div>Commercials: <strong className="text-teal-700">{srv.pricingModel}</strong></div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Headquarters: {srv.organisation.registeredState}</span>
                <button
                  onClick={() => alert(`Enquiry initiated for ${srv.title}. Our team will connect you with ${srv.organisation.legalName}.`)}
                  className="bg-navy-900 hover:bg-teal-600 text-white hover:text-navy-900 font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Request Advisory Quote</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
