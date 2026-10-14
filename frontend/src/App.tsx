import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { MarketplaceExplorer } from './pages/MarketplaceExplorer';
import { ListingDetailPage } from './pages/ListingDetailPage';
import { BillToProcurementWizard } from './pages/BillToProcurementWizard';
import { EconomicsCalculatorPage } from './pages/EconomicsCalculatorPage';
import { BuyPowerPage } from './pages/BuyPowerPage';
import { SellPowerPage } from './pages/SellPowerPage';
import { StorageMarketplacePage } from './pages/StorageMarketplacePage';
import { TendersPage } from './pages/TendersPage';
import { ServicesPage } from './pages/ServicesPage';
import { Dashboards } from './pages/Dashboards';
import { AuthPages } from './pages/AuthPages';
import { LegalPages } from './pages/LegalPages';
import { api } from './services/api';
import { User, Organisation } from './types';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<string>('home');
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentOrg, setCurrentOrg] = useState<Organisation | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Check existing session on mount
  useEffect(() => {
    async function initSession() {
      const token = localStorage.getItem('eb_token');
      if (token) {
        try {
          const res = await api.getMe();
          setCurrentUser(res.user);
          setCurrentOrg(res.activeOrganisation);
        } catch (err) {
          console.warn("Session check failed, clearing token", err);
          localStorage.removeItem('eb_token');
        }
      }
      setIsInitializing(false);
    }
    initSession();
  }, []);

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
    setCurrentOrg(null);
    setCurrentView('home');
  };

  const handleSelectListing = (id: string) => {
    setSelectedListingId(id);
    setCurrentView('listing-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Quick Demo Login helper for paired review
  const handleQuickDemoLogin = async (roleKey: 'buyer_tn' | 'buyer_tg' | 'seller_tg' | 'seller_tn' | 'admin') => {
    const credsMap = {
      buyer_tn: { email: 'procurement@coimbatoreauto.demo', password: 'Demo@123456' },
      buyer_tg: { email: 'procurement@hydpharma.demo', password: 'Demo@123456' },
      seller_tn: { email: 'power@kongurenewables.demo', password: 'Demo@123456' },
      seller_tg: { email: 'bd@deccangreen.demo', password: 'Demo@123456' },
      admin: { email: 'admin@electricitybazaar.in', password: 'Demo@123456' }
    };

    try {
      const res = await api.login(credsMap[roleKey]);
      setCurrentUser(res.user);
      setCurrentOrg(res.organisation);
      setCurrentView('dashboard');
    } catch (err: any) {
      alert(`Demo login error: ${err.message}`);
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center text-white">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-300 font-semibold tracking-wider uppercase">Loading Electricity Bazaar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar
        currentView={currentView}
        setCurrentView={(view) => {
          setCurrentView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        currentUser={currentUser}
        currentOrg={currentOrg}
        onLogout={handleLogout}
        onQuickDemoLogin={handleQuickDemoLogin}
      />

      <main className="flex-1">
        {currentView === 'home' && (
          <HomePage
            setCurrentView={setCurrentView}
            onSelectListing={handleSelectListing}
          />
        )}

        {currentView === 'marketplace' && (
          <MarketplaceExplorer
            onSelectListing={handleSelectListing}
            setCurrentView={setCurrentView}
          />
        )}

        {currentView === 'listing-detail' && selectedListingId && (
          <ListingDetailPage
            listingId={selectedListingId}
            onBack={() => setCurrentView('marketplace')}
            setCurrentView={setCurrentView}
            onSelectListing={handleSelectListing}
          />
        )}

        {currentView === 'wizard' && (
          <BillToProcurementWizard
            setCurrentView={setCurrentView}
            onSelectListing={handleSelectListing}
          />
        )}

        {currentView === 'calculator' && (
          <EconomicsCalculatorPage />
        )}

        {currentView === 'buy-power' && (
          <BuyPowerPage setCurrentView={setCurrentView} />
        )}

        {currentView === 'sell-power' && (
          <SellPowerPage setCurrentView={setCurrentView} />
        )}

        {currentView === 'storage' && (
          <StorageMarketplacePage
            onSelectListing={handleSelectListing}
            setCurrentView={setCurrentView}
          />
        )}

        {currentView === 'tenders' && (
          <TendersPage />
        )}

        {currentView === 'services' && (
          <ServicesPage />
        )}

        {currentView === 'dashboard' && currentUser && (
          <Dashboards
            currentUser={currentUser}
            currentOrg={currentOrg}
            setCurrentView={setCurrentView}
            onSelectListing={handleSelectListing}
          />
        )}

        {currentView === 'dashboard' && !currentUser && (
          <AuthPages
            initialMode="login"
            setCurrentView={setCurrentView}
            onLoginSuccess={(user, org) => {
              setCurrentUser(user);
              setCurrentOrg(org);
            }}
          />
        )}

        {currentView === 'login' && (
          <AuthPages
            initialMode="login"
            setCurrentView={setCurrentView}
            onLoginSuccess={(user, org) => {
              setCurrentUser(user);
              setCurrentOrg(org);
            }}
          />
        )}

        {currentView === 'register' && (
          <AuthPages
            initialMode="register"
            setCurrentView={setCurrentView}
            onLoginSuccess={(user, org) => {
              setCurrentUser(user);
              setCurrentOrg(org);
            }}
          />
        )}

        {/* Legal Pages */}
        {currentView.startsWith('legal-') && (
          <LegalPages
            section={currentView.replace('legal-', '') as any}
            setCurrentView={setCurrentView}
          />
        )}
      </main>

      <Footer setCurrentView={(view) => {
        setCurrentView(view);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }} />
    </div>
  );
};
export default App;
