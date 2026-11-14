import React, { useState, useEffect } from 'react';
import { useBattle } from '../context/BattleContext';
import { 
  Monitor, 
  Send, 
  ShieldCheck, 
  Lock, 
  Maximize, 
  Minimize, 
  Radio, 
  Flame, 
  Award,
  Clock,
  Sparkles
} from 'lucide-react';

export default function Navbar() {
  const { 
    activeView, 
    switchView, 
    timer, 
    published, 
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

  return (
    <header className="sticky top-0 z-50 bg-dark-950/90 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 md:h-24">
          
          {/* Left: PES Logo (BIG) beside EEE Fest Logo */}
          <div className="flex items-center space-x-3 sm:space-x-5">
            {/* IEEE PES DIU SBC Logo (Made big as requested) */}
            <div className="flex items-center">
              <img 
                src="./assets/ieee-pes-diu-logo.png" 
                alt="IEEE PES DIU Student Branch Chapter" 
                className="h-14 sm:h-16 md:h-20 w-auto object-contain transition-transform hover:scale-105 filter drop-shadow-[0_0_12px_rgba(108,179,63,0.3)]"
              />
            </div>

            {/* Subtle Divider */}
            <div className="h-8 md:h-12 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent"></div>

            {/* EEE Fest Logo */}
            <div className="flex items-center">
              <img 
                src="./assets/eee-fest-logo.png" 
                alt="EEE Fest 2026" 
                className="h-9 sm:h-11 md:h-14 w-auto object-contain filter drop-shadow-[0_0_12px_rgba(0,229,255,0.25)]"
              />
            </div>

            {/* Title / Tagline */}
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

          {/* Center / Right: Navigation Portals (Plain tabs, no card shapes) */}
          <div className="flex items-center space-x-1 sm:space-x-3">
            
            {/* Portal Switcher */}
            <nav className="flex items-center p-1 rounded-lg bg-dark-900 border border-white/10">
              
              {/* Presentation View */}
              <button
                onClick={() => switchView('presentation')}
                className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded text-xs sm:text-sm font-medium transition-all ${
                  activeView === 'presentation'
                    ? 'bg-gradient-to-r from-fest-cyan/20 to-fest-blue/20 text-fest-cyan border border-fest-cyan/40 shadow-[0_0_15px_rgba(0,229,255,0.2)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
                title="Presentation View for Projector"
              >
                <Monitor className="w-4 h-4" />
                <span className="hidden sm:inline">Presentation</span>
                {published && (
                  <span className="w-2 h-2 rounded-full bg-fest-pink animate-pulse" title="Leaderboard Live"></span>
                )}
              </button>

              {/* Participant Submit View */}
              <button
                onClick={() => switchView('submit')}
                className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded text-xs sm:text-sm font-medium transition-all ${
                  activeView === 'submit'
                    ? 'bg-gradient-to-r from-fest-pink/20 to-purple-600/20 text-fest-pink border border-fest-pink/40 shadow-[0_0_15px_rgba(255,0,122,0.2)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
                title="Participant Submission Portal"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Submit Work</span>
              </button>

              {/* Admin Portal */}
              <button
                onClick={() => switchView('admin')}
                className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded text-xs sm:text-sm font-medium transition-all ${
                  activeView === 'admin'
                    ? 'bg-gradient-to-r from-fest-pes/20 to-emerald-600/20 text-fest-pes border border-fest-pes/40 shadow-[0_0_15px_rgba(108,179,63,0.2)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
                title="Admin Control Center"
              >
                {isAdminAuthenticated ? (
                  <ShieldCheck className="w-4 h-4 text-fest-pes" />
                ) : (
                  <Lock className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">Admin</span>
              </button>
            </nav>

            {/* Live Battle Badge */}
            <div className="hidden xl:flex items-center px-3 py-1.5 rounded bg-dark-900 border border-white/10 text-xs font-mono">
              <span className={`w-2 h-2 rounded-full mr-2 ${
                timer.status === 'running' 
                  ? 'bg-emerald-400 animate-ping' 
                  : timer.status === 'paused'
                  ? 'bg-amber-400'
                  : 'bg-slate-500'
              }`}></span>
              <span className="text-slate-300 uppercase tracking-wider font-semibold">
                {timer.status === 'running' ? 'Battle Active' : timer.status === 'paused' ? 'Paused' : 'Standby'}
              </span>
            </div>

            {/* Cloud Sync Status */}
            <div 
              className="hidden md:flex items-center px-2.5 py-1.5 rounded bg-dark-900 border border-white/10 text-xs font-mono text-slate-400"
              title={firebaseStatus === 'connected' ? 'Firebase Realtime Connected' : 'Local Multi-Tab Broadcast Sync Active'}
            >
              <Radio className={`w-3.5 h-3.5 mr-1.5 ${
                firebaseStatus === 'connected' ? 'text-fest-cyan animate-pulse' : 'text-slate-500'
              }`} />
              <span className="text-[11px]">
                {firebaseStatus === 'connected' ? 'Cloud Live' : 'Local Sync'}
              </span>
            </div>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded bg-dark-900 border border-white/10 text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen (Auditorium Mode)'}
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>

          </div>
        </div>
      </div>
    </header>
  );
}
