import React, { useState, useEffect } from 'react';
import { useBattle } from '../context/BattleContext';
import { 
  Maximize, 
  Minimize, 
  ExternalLink,
  ShieldCheck, 
  Sparkles,
  Smartphone
} from 'lucide-react';

export default function Navbar() {
  const { 
    activeView, 
    isAdminAuthenticated 
  } = useBattle();

  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => console.warn(err));
    } else {
      document.exitFullscreen().catch((err) => console.warn(err));
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-dark-950/95 backdrop-blur-md border-b border-white/10">
      <div className="w-full max-w-[1750px] mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 md:h-24">
          
          {/* Left: IEEE PES DIU SBC Logo (BIG) & EEE Fest 2026 Logo */}
          <div className="flex items-center space-x-2.5 sm:space-x-5">
            <div className="flex items-center">
              <img 
                src="./assets/ieee-pes-diu-logo.png" 
                alt="IEEE PES DIU Student Branch Chapter" 
                className="h-11 sm:h-16 md:h-20 w-auto object-contain filter drop-shadow-[0_0_15px_rgba(108,179,63,0.35)]"
              />
            </div>

            <div className="h-6 sm:h-8 md:h-12 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent"></div>

            <div className="flex items-center">
              <img 
                src="./assets/eee-fest-logo.png" 
                alt="EEE Fest 2026" 
                className="h-7 sm:h-10 md:h-14 w-auto object-contain filter drop-shadow-[0_0_12px_rgba(0,229,255,0.25)]"
              />
            </div>

            {/* Event Brand Title */}
            <div className="hidden lg:flex flex-col ml-2">
              <div className="flex items-center space-x-2">
                <span className="text-xl font-extrabold tracking-wider text-fest-gradient font-sans">
                  PROMPT BATTLE
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-fest-pink/15 text-fest-pink border border-fest-pink/30 font-mono font-bold tracking-tight">
                  2026
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-fest-cyan" />
                IEEE PES DIU SBC • EEE FEST 2026
              </span>
            </div>
          </div>

          {/* Right Section: Clean, Minimalist Display per View */}
          <div className="flex items-center space-x-3">
            
            {/* 1. PRESENTATION VIEW: 100% Clean Projector Display (NO switching panels or badges) */}
            {activeView === 'presentation' && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleFullscreen}
                  className="p-2.5 rounded-lg bg-dark-900 border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                  title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen (Auditorium Projector Mode)'}
                >
                  {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                </button>
              </div>
            )}

            {/* 2. PARTICIPANT VIEW */}
            {activeView === 'submit' && (
              <div className="flex items-center px-3 py-1.5 rounded-full bg-dark-900 border border-white/10 text-xs font-mono text-slate-300">
                <span className="w-2 h-2 rounded-full bg-fest-cyan animate-pulse mr-2"></span>
                <span>Contender Portal</span>
              </div>
            )}

            {/* 3. ADMIN VIEW */}
            {activeView === 'admin' && (
              <div className="flex items-center space-x-3">
                <div className="flex items-center px-3 py-1.5 rounded bg-fest-pes/10 border border-fest-pes/30 text-xs font-mono text-fest-pes">
                  <ShieldCheck className="w-4 h-4 mr-1.5" />
                  <span>Admin Command</span>
                </div>

                <a
                  href="./#presentation"
                  target="_blank"
                  rel="noreferrer"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-dark-900 border border-white/15 text-fest-cyan hover:text-white font-mono text-xs transition-colors"
                  title="Open Presentation Screen on a separate monitor/projector"
                >
                  <span>Open Projector</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <a
                  href="./#submit"
                  target="_blank"
                  rel="noreferrer"
                  className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-dark-900 border border-white/15 text-slate-300 hover:text-white font-mono text-xs transition-colors"
                  title="Open Participant Screen in new tab"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Phone View</span>
                </a>
              </div>
            )}

          </div>

        </div>
      </div>
    </header>
  );
}
