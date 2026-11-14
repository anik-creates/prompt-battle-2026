import React, { useState, useEffect } from 'react';
import { useBattle } from '../context/BattleContext';
import { 
  Maximize, 
  Minimize, 
  Radio, 
  ExternalLink,
  ShieldCheck, 
  Sparkles,
  Flame,
  Vote,
  HelpCircle
} from 'lucide-react';

export default function Navbar() {
  const { 
    activeView, 
    switchView, 
    activeArena, 
    timer, 
    published, 
    poll, 
    quiz, 
    isAdminAuthenticated, 
    firebaseStatus 
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

  // Determine active arena title for status badge
  let arenaTitle = 'Battle Arena';
  let arenaIcon = <Flame className="w-3.5 h-3.5 text-fest-cyan" />;
  if (activeArena === 'poll') {
    arenaTitle = 'Live Poll Active';
    arenaIcon = <Vote className="w-3.5 h-3.5 text-fest-pink" />;
  } else if (activeArena === 'quiz') {
    arenaTitle = 'Kahoot Quiz Active';
    arenaIcon = <HelpCircle className="w-3.5 h-3.5 text-fest-amber" />;
  }

  return (
    <header className="sticky top-0 z-50 bg-dark-950/95 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 md:h-24">
          
          {/* Left: IEEE PES DIU SBC Logo (BIG) & EEE Fest 2026 Logo */}
          <div className="flex items-center space-x-3 sm:space-x-5">
            <div className="flex items-center">
              <img 
                src="./assets/ieee-pes-diu-logo.png" 
                alt="IEEE PES DIU Student Branch Chapter" 
                className="h-14 sm:h-16 md:h-20 w-auto object-contain filter drop-shadow-[0_0_15px_rgba(108,179,63,0.35)]"
              />
            </div>

            <div className="h-8 md:h-12 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent"></div>

            <div className="flex items-center">
              <img 
                src="./assets/eee-fest-logo.png" 
                alt="EEE Fest 2026" 
                className="h-9 sm:h-11 md:h-14 w-auto object-contain filter drop-shadow-[0_0_15px_rgba(0,229,255,0.25)]"
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

          {/* Right Section: Varies cleanly by View */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            
            {/* 1. PRESENTATION VIEW (AUDITORIUM BROADCAST): Clean, Distraction-Free */}
            {activeView === 'presentation' && (
              <div className="flex items-center space-x-3">
                {/* Live Arena Stage Status Badge */}
                <div className="flex items-center px-3.5 py-1.5 rounded-full bg-dark-900 border border-white/10 text-xs font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping mr-2.5"></span>
                  <span className="flex items-center gap-1.5 text-slate-200 uppercase tracking-wider font-semibold">
                    {arenaIcon}
                    <span>{arenaTitle}</span>
                  </span>
                </div>

                {/* Cloud Sync Status */}
                <div 
                  className="hidden md:flex items-center px-2.5 py-1.5 rounded bg-dark-900 border border-white/10 text-xs font-mono text-slate-400"
                  title="Real-Time Cloud Synced"
                >
                  <Radio className="w-3.5 h-3.5 mr-1.5 text-fest-cyan animate-pulse" />
                  <span className="text-[11px]">Live Broadcast</span>
                </div>

                {/* Fullscreen Button for Projector Operator */}
                <button
                  onClick={toggleFullscreen}
                  className="p-2.5 rounded-lg bg-dark-900 border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                  title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen (Auditorium Projector Mode)'}
                >
                  {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                </button>
              </div>
            )}

            {/* 2. PARTICIPANT VIEW: Minimalist Contender Header */}
            {activeView === 'submit' && (
              <div className="flex items-center space-x-3">
                <div className="flex items-center px-3 py-1.5 rounded-full bg-dark-900 border border-white/10 text-xs font-mono text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-fest-cyan animate-pulse mr-2"></span>
                  <span>Contender Live Arena</span>
                </div>
              </div>
            )}

            {/* 3. ADMIN VIEW: Admin Tools & Quick Links */}
            {activeView === 'admin' && (
              <div className="flex items-center space-x-3">
                <div className="flex items-center px-3 py-1.5 rounded bg-fest-pes/10 border border-fest-pes/30 text-xs font-mono text-fest-pes">
                  <ShieldCheck className="w-4 h-4 mr-1.5" />
                  <span>Admin Mode</span>
                </div>

                {/* Quick Link to open the Presentation Screen in new window (for projector) */}
                <a
                  href="./#presentation"
                  target="_blank"
                  rel="noreferrer"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-dark-900 border border-white/15 text-fest-cyan hover:text-white font-mono text-xs transition-colors"
                  title="Open Presentation Screen on a separate monitor/projector"
                >
                  <span>Projector View</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                {/* Quick Link to preview Participant View */}
                <a
                  href="./#submit"
                  target="_blank"
                  rel="noreferrer"
                  className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-dark-900 border border-white/15 text-slate-400 hover:text-white font-mono text-xs transition-colors"
                >
                  <span>Phone View</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

          </div>

        </div>
      </div>
    </header>
  );
}
