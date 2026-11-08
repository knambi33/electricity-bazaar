import React, { useState, useEffect } from 'react';
import { Sparkles, Flame, X, ArrowRight, Sun, Gift } from 'lucide-react';

interface DeepavaliBannerProps {
  onExplore?: () => void;
}

export const DeepavaliBanner: React.FC<DeepavaliBannerProps> = ({ onExplore }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    const isDismissed = sessionStorage.getItem('eb_deepavali_banner_dismissed');
    if (isDismissed === 'true') {
      setIsMinimized(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsMinimized(true);
    sessionStorage.setItem('eb_deepavali_banner_dismissed', 'true');
  };

  const handleRestore = () => {
    setIsMinimized(false);
    sessionStorage.removeItem('eb_deepavali_banner_dismissed');
  };

  if (!isVisible) return null;

  if (isMinimized) {
    return (
      <div className="bg-gradient-to-r from-amber-900 via-orange-950 to-amber-900 border-b border-amber-500/40 py-1.5 px-4 text-center">
        <button
          onClick={handleRestore}
          className="inline-flex items-center space-x-2 text-xs font-bold text-amber-200 hover:text-white transition group"
        >
          <span className="text-base animate-bounce">🪔</span>
          <span>Happy Deepavali to all our Readers & Subscribers!</span>
          <span className="text-[11px] bg-amber-500/30 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/40 group-hover:bg-amber-500/50">
            View Festive Message ✨
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-amber-950 via-orange-900 to-amber-950 text-white border-b-2 border-amber-400/60 shadow-xl transition-all">
      {/* Decorative festive ambient glows */}
      <div className="absolute -left-12 -top-12 w-44 h-44 bg-amber-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -right-12 -bottom-12 w-44 h-44 bg-orange-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      
      {/* Golden rangoli / geometric dot texture pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:20px_20px] opacity-15 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
          
          {/* Left Festive Header & Greetings */}
          <div className="flex items-center space-x-3.5">
            {/* Animated Diya icon badge */}
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/40 border border-amber-200">
                <span className="text-2xl drop-shadow select-none">🪔</span>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-300 rounded-full flex items-center justify-center animate-ping opacity-75"></div>
            </div>

            <div className="space-y-0.5">
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/40 text-[10px] font-black uppercase tracking-wider text-amber-200">
                <Sparkles className="w-3 h-3 text-amber-300 animate-spin-slow" />
                <span>Festival of Lights & Clean Energy</span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-amber-100 brand-font flex items-center justify-center md:justify-start space-x-2">
                <span>Shubh Deepavali to Our Valued Readers & Subscribers!</span>
                <span className="hidden sm:inline">✨</span>
              </h2>
              <p className="text-xs text-amber-200/90 leading-relaxed max-w-2xl">
                May the divine light of Deepavali brighten your business, power your journey with prosperity, and bring abundance of sustainable green energy. Electricity Bazaar wishes all industrial power consumers, renewable developers, power traders, and loyal subscribers a joyous and radiant Deepavali!
              </p>
            </div>
          </div>

          {/* Right Action & Dismiss buttons */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            {onExplore && (
              <button
                onClick={onExplore}
                className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-navy-950 font-black px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition shadow-lg shadow-amber-500/20"
              >
                <span>Festive Energy Deals</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={handleDismiss}
              className="p-1.5 rounded-xl text-amber-300/80 hover:text-white hover:bg-amber-900/60 transition"
              title="Minimize Deepavali Banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
