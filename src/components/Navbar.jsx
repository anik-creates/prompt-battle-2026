import React, { useState, useEffect } from 'react';
import { useBattle } from '../context/BattleContext';
import { 
  Maximize, 
  Minimize, 
  ExternalLink,
  ShieldCheck, 
  Sparkles,
  Smartphone,
  Tv,
  LogOut,
  Lock,
  Scale,
  LogIn
} from 'lucide-react';

export default function Navbar() {
  const { 
    activeView, 
    switchView,
    isAdminAuthenticated,
    logoutAdmin
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
            <div className="flex items-center cursor-pointer" onClick={() => switchView('submit')} title="Return to Home (Participant Portal)">
              <img 
                src="./assets/ieee-pes-diu-logo.png" 
                alt="IEEE PES DIU Student Branch Chapter" 
                className="h-11 sm:h-16 md:h-20 w-auto object-contain filter drop-shadow-[0_0_15px_rgba(108,179,63,0.35)]"
              />
            </div>

            <div className="h-6 sm:h-8 md:h-12 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent"></div>

            <div className="flex items-center cursor-pointer" onClick={() => switchView('submit')} title="Return to Home (Participant Portal)">
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

          {/* Right Section: Clean Navigation (Projector & Login) + Fullscreen */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* View Switcher Navigation Pill Group: Exactly 2 options */}
            <div className="flex items-center bg-dark-900/90 p-1 rounded-xl border border-white/10 space-x-1">
              {/* 1. Presentation / Projector View */}
              <button
                onClick={() => switchView('presentation')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs transition-all ${
                  activeView === 'presentation'
                    ? 'bg-fest-cyan/15 text-fest-cyan border border-fest-cyan/40 shadow-[0_0_12px_rgba(0,229,255,0.2)] font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
                title="Auditorium Projector View (/presentation)"
              >
                <Tv className="w-3.5 h-3.5" />
                <span>Projector</span>
              </button>

              {/* 2. Login Portal View (All Logins: Participant, Judge, Admin) */}
              <button
                onClick={() => switchView('submit')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-mono text-xs transition-all ${
                  activeView !== 'presentation'
                    ? 'bg-fest-pink/15 text-fest-pink border border-fest-pink/40 shadow-[0_0_12px_rgba(255,0,128,0.2)] font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
                title="Login Portal (Participant, Judge, Admin)"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Login</span>
              </button>
            </div>

            {/* Fullscreen Mode Button */}
            <button
              onClick={toggleFullscreen}
              className="p-2 sm:p-2.5 rounded-xl bg-dark-900/90 border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-colors shadow-sm"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen Mode'}
            >
              {isFullscreen ? <Minimize className="w-4 h-4 text-fest-cyan" /> : <Maximize className="w-4 h-4" />}
            </button>

            {activeView === 'admin' && (
              <div className="hidden lg:flex items-center space-x-2">
                <a
                  href="./presentation"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-dark-900 border border-white/15 text-fest-cyan hover:text-white font-mono text-xs transition-colors"
                  title="Open Presentation Screen on a separate projector/tab"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>New Window</span>
                </a>

                {isAdminAuthenticated && (
                  <button
                    onClick={logoutAdmin}
                    className="p-1.5 rounded bg-dark-900 border border-rose-500/30 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                    title="Lock Admin Arena (Log Out)"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

          </div>

        </div>
      </div>
    </header>
  );
}
