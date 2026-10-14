import React, { useState } from 'react';
import { 
  Zap, 
  Menu, 
  X, 
  Search, 
  Calculator, 
  FileText, 
  ShieldCheck, 
  Layers, 
  BatteryCharging, 
  User as UserIcon, 
  LogOut,
  Building2,
  ArrowRight
} from 'lucide-react';
import { User, Organisation } from '../types';

interface NavbarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  currentUser: User | null;
  currentOrg: Organisation | null;
  onLogout: () => void;
  onQuickDemoLogin: (role: 'buyer_tn' | 'buyer_tg' | 'seller_tg' | 'seller_tn' | 'admin') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  currentUser,
  currentOrg,
  onLogout,
  onQuickDemoLogin
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoMenuOpen, setDemoMenuOpen] = useState(false);

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'marketplace', label: 'Marketplace' },
    { id: 'wizard', label: 'Bill-to-Power Wizard', highlight: true },
    { id: 'calculator', label: 'Economics Calculator' },
    { id: 'storage', label: 'Storage (BESS/PSP)' },
    { id: 'tenders', label: 'Tenders' },
    { id: 'services', label: 'Services' },
    { id: 'buy-power', label: 'Buy Power' },
    { id: 'sell-power', label: 'Sell Power' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-navy-900 border-b border-slate-800 text-white shadow-lg">
      {/* Top micro-bar: Pilot States notice & quick demo switcher */}
      <div className="bg-navy-800 px-4 py-1 text-xs text-slate-300 border-b border-slate-800 flex flex-wrap justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="inline-block w-2 h-2 rounded-full bg-energy-green animate-pulse"></span>
          <span>
            <strong className="text-teal-400">Flagship Dual Pilot:</strong> Active in <span className="text-white font-semibold">Tamil Nadu (TNERC / TANGEDCO)</span> & <span className="text-white font-semibold">Telangana (TSERC / TSSPDCL)</span>
          </span>
        </div>
        <div className="flex items-center space-x-3 mt-1 sm:mt-0">
          <span className="text-slate-400 hidden sm:inline">Switch Demo Profile:</span>
          <button
            onClick={() => onQuickDemoLogin('buyer_tn')}
            className="hover:text-teal-400 text-slate-300 font-medium transition"
            title="Tamil Nadu Launch Customer (Coimbatore Auto)"
          >
            TN Buyer
          </button>
          <span className="text-slate-600">|</span>
          <button
            onClick={() => onQuickDemoLogin('buyer_tg')}
            className="hover:text-teal-400 text-slate-300 font-medium transition"
            title="Telangana Bulk Drugs (Hyderabad Pharma)"
          >
            TG Buyer
          </button>
          <span className="text-slate-600">|</span>
          <button
            onClick={() => onQuickDemoLogin('seller_tn')}
            className="hover:text-teal-400 text-slate-300 font-medium transition"
            title="Kongu Renewables (15 MW Kayathar Hybrid)"
          >
            TN Seller
          </button>
          <span className="text-slate-600">|</span>
          <button
            onClick={() => onQuickDemoLogin('admin')}
            className="hover:text-amber-400 text-slate-300 font-medium transition"
          >
            Admin
          </button>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div 
            className="flex items-center space-x-3 cursor-pointer select-none"
            onClick={() => setCurrentView('home')}
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-teal-600 to-emerald-400 flex items-center justify-center shadow-md shadow-teal-500/20">
              <Zap className="w-6 h-6 text-navy-900 fill-current" />
            </div>
            <div>
              <div className="flex items-center space-x-1">
                <span className="text-xl font-bold tracking-tight text-white brand-font">Electricity</span>
                <span className="text-xl font-extrabold tracking-tight text-teal-400 brand-font">Bazaar</span>
              </div>
              <span className="text-[10px] tracking-wider text-slate-400 uppercase block font-medium">
                India's Power Marketplace
              </span>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => setCurrentView(link.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all ${
                  currentView === link.id
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                    : link.highlight
                    ? 'text-amber-300 hover:text-amber-200 bg-amber-500/10 border border-amber-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Right Actions / Auth Session */}
          <div className="hidden lg:flex items-center space-x-3">
            {currentUser ? (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-700 transition"
                >
                  <Building2 className="w-3.5 h-3.5 text-teal-400" />
                  <span className="truncate max-w-[120px]">{currentOrg?.legalName || currentUser.fullName}</span>
                  <span className="text-[10px] bg-teal-500/20 text-teal-300 px-1.5 py-0.5 rounded font-mono uppercase">
                    {currentUser.role.split('_')[0]}
                  </span>
                </button>
                <button
                  onClick={onLogout}
                  className="text-slate-400 hover:text-red-400 p-1.5 rounded transition"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentView('login')}
                  className="text-slate-300 hover:text-white px-3 py-1.5 rounded-md text-xs font-semibold transition"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setCurrentView('register')}
                  className="bg-teal-600 hover:bg-teal-500 text-navy-900 font-bold px-3.5 py-1.5 rounded-md text-xs transition shadow-sm"
                >
                  Join Marketplace
                </button>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="flex lg:hidden items-center space-x-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-navy-900 border-b border-slate-800 px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => {
                setCurrentView(link.id);
                setMobileMenuOpen(false);
              }}
              className={`block w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                currentView === link.id
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {link.label}
            </button>
          ))}
          <div className="pt-3 border-t border-slate-800 flex flex-col space-y-2">
            {currentUser ? (
              <>
                <button
                  onClick={() => {
                    setCurrentView('dashboard');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left bg-slate-800 text-teal-300 px-3 py-2 rounded-md text-sm font-medium"
                >
                  My Dashboard ({currentUser.fullName})
                </button>
                <button
                  onClick={() => {
                    onLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left text-red-400 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setCurrentView('login');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2 text-center rounded-md text-sm font-medium text-slate-300 bg-slate-800"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setCurrentView('register');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2 text-center rounded-md text-sm font-bold text-navy-900 bg-teal-500"
                >
                  Join
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
