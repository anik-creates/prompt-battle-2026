import React, { useState, useEffect, useRef } from 'react';
import { useBattle } from '../context/BattleContext';
import SecureProblemCanvas from './SecureProblemCanvas';
import { 
  Lock, 
  Unlock, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Zap, 
  Terminal, 
  EyeOff,
  Radio,
  MapPin,
  HelpCircle
} from 'lucide-react';

export default function LockedProblemStatementWindow({ activeSession, isSimulator = false }) {
  const { problemStatement = {}, timer } = useBattle();
  const [securityAlert, setSecurityAlert] = useState('');
  const alertTimeoutRef = useRef(null);

  const isReleased = problemStatement.status === 'released';

  const triggerSecurityAlert = (msg) => {
    setSecurityAlert(msg || 'Protected View: Copying, inspecting, and dev shortcuts are locked.');
    if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
    alertTimeoutRef.current = setTimeout(() => {
      setSecurityAlert('');
    }, 2800);
  };

  // Keyboard protection against F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U, Ctrl+C, Ctrl+S, Ctrl+P
  useEffect(() => {
    if (isSimulator) return;

    const handleKeyDown = (e) => {
      const isCtrlOrMeta = e.ctrlKey || e.metaKey;
      const key = e.key ? e.key.toLowerCase() : '';

      // Block F12
      if (e.keyCode === 123 || e.key === 'F12') {
        e.preventDefault();
        e.stopPropagation();
        triggerSecurityAlert('F12 DevTools Inspection is disabled during competition.');
        return false;
      }

      // Block Ctrl+Shift+I / J / C (DevTools)
      if (isCtrlOrMeta && e.shiftKey && (key === 'i' || key === 'j' || key === 'c')) {
        e.preventDefault();
        e.stopPropagation();
        triggerSecurityAlert('DevTools Element Inspection is restricted.');
        return false;
      }

      // Block Ctrl+U (View Source)
      if (isCtrlOrMeta && key === 'u') {
        e.preventDefault();
        e.stopPropagation();
        triggerSecurityAlert('View Page Source is restricted.');
        return false;
      }

      // Block Ctrl+S (Save Page)
      if (isCtrlOrMeta && key === 's') {
        e.preventDefault();
        e.stopPropagation();
        triggerSecurityAlert('Saving page is disabled.');
        return false;
      }

      // Block Ctrl+P (Print Page)
      if (isCtrlOrMeta && key === 'p') {
        e.preventDefault();
        e.stopPropagation();
        triggerSecurityAlert('Printing problem statement is restricted.');
        return false;
      }

      // Block Ctrl+C / Ctrl+A if pressed inside problem window
      if (isCtrlOrMeta && (key === 'c' || key === 'a')) {
        const selection = window.getSelection()?.toString();
        if (selection && selection.length > 0) {
          e.preventDefault();
          e.stopPropagation();
          triggerSecurityAlert('Text copying is disabled for competition security.');
          return false;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isSimulator]);

  // Contender Watermark Identifier
  const watermarkText = activeSession 
    ? `${activeSession.name || 'Contender'} • ${activeSession.studentId || activeSession.participantId || 'ID'} • ${activeSession.deskNumber || 'Desk'} • PES DIU SBC 2026`
    : 'IEEE PES DIU SBC • PROMPT BATTLE 2026';

  // Format release time
  const releaseTimeStr = problemStatement.releasedAt 
    ? new Date(problemStatement.releasedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null;

  return (
    <div 
      className="w-full relative rounded-2xl border transition-all duration-300 font-mono select-none"
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        triggerSecurityAlert('Right-click context menu is restricted on problem statement.');
        return false;
      }}
      onCopy={(e) => {
        e.preventDefault();
        e.stopPropagation();
        triggerSecurityAlert('Text copying is disabled for competition security.');
        return false;
      }}
      onCut={(e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }}
      onDragStart={(e) => {
        e.preventDefault();
        return false;
      }}
    >
      {/* Toast Alert for security violations */}
      {securityAlert && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-rose-950/95 border border-rose-500/80 text-rose-200 text-xs font-mono shadow-[0_0_30px_rgba(244,63,94,0.6)] flex items-center gap-2 animate-bounce">
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{securityAlert}</span>
        </div>
      )}

      {/* STATE 1: LOCKED / NOT RELEASED YET */}
      {!isReleased ? (
        <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-dark-900 via-dark-950 to-dark-950 border-2 border-fest-amber/40 shadow-[0_0_40px_rgba(255,183,0,0.15)] text-center space-y-5">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-2xl bg-fest-amber/20 animate-ping opacity-60"></div>
            <div className="relative w-16 h-16 rounded-2xl bg-fest-amber/15 border-2 border-fest-amber/40 text-fest-amber flex items-center justify-center shadow-[0_0_25px_rgba(255,183,0,0.4)]">
              <Lock className="w-8 h-8 text-fest-amber" />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-fest-amber/15 border border-fest-amber/30 text-fest-amber text-[11px] font-bold uppercase tracking-wider">
              <Radio className="w-3 h-3 text-fest-amber animate-pulse" />
              <span>Waiting for Admin Broadcast</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold font-sans text-white uppercase tracking-tight">
              Problem Statement Not Released Yet
            </h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              The official competition challenge statement is currently locked. The administrator will broadcast and unlock it simultaneously for all contenders.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-dark-950 border border-white/10 max-w-md mx-auto text-left space-y-2 text-xs">
            <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-white/10 pb-2">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-fest-cyan" />
                <span>Your Assigned Station:</span>
              </span>
              <strong className="text-fest-amber font-mono font-bold text-sm">
                {activeSession?.deskNumber || 'Desk Station'}
              </strong>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed pt-1">
              Please remain seated at your desk. As soon as the problem statement is released from the admin console, this window will automatically unlock in real-time.
            </p>
          </div>

          <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-fest-pes" />
            <span>Anti-Leak Security Protocol Active • Screen Locked</span>
          </div>
        </div>
      ) : (
        /* STATE 2: RELEASED / ACTIVE PROBLEM STATEMENT */
        <div className="rounded-2xl bg-dark-900 border-2 border-fest-cyan/40 shadow-[0_0_50px_rgba(0,229,255,0.15)] overflow-hidden relative">
          
          {/* Subtle Anti-Camera Watermark Background Overlay */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-[0.04] z-0 overflow-hidden flex flex-wrap gap-8 p-4 select-none"
            style={{ transform: 'rotate(-12deg) scale(1.15)' }}
          >
            {Array.from({ length: 28 }).map((_, i) => (
              <span key={i} className="text-white text-xs font-mono font-black uppercase whitespace-nowrap">
                {watermarkText}
              </span>
            ))}
          </div>

          {/* Top Header Bar */}
          <div className="p-4 sm:p-5 bg-dark-950 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)] shrink-0">
                <FileText className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Problem Statement Active</span>
                  </span>
                  {releaseTimeStr && (
                    <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                      Released: {releaseTimeStr}
                    </span>
                  )}
                </div>
                <h3 className="font-bold font-sans text-base sm:text-lg text-white mt-0.5">
                  {problemStatement.title || 'Official Prompt Battle Challenge'}
                </h3>
              </div>
            </div>

            {/* Security Badge (Tamper-Locked) */}
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-dark-900 border border-fest-pink/30 text-fest-pink text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_10px_rgba(255,0,122,0.15)]">
                <ShieldCheck className="w-3.5 h-3.5 text-fest-pink" />
                <span>Protected View • Copy Locked</span>
              </span>
            </div>
          </div>

          {/* RASTERIZED SECURE CANVAS (ZERO DOM TEXT NODES) */}
          <div className="p-3 sm:p-5 relative z-10">
            <SecureProblemCanvas 
              problemStatement={problemStatement}
              activeSession={activeSession}
              mode="participant"
            />
          </div>

          {/* Bottom Security Footer */}
          <div className="p-3 bg-dark-950 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400 px-5">
            <span className="flex items-center gap-1.5">
              <EyeOff className="w-3.5 h-3.5 text-fest-pink" />
              <span>Inspection, text selection, and copying are disabled by IEEE PES DIU SBC.</span>
            </span>
            <span className="text-fest-amber font-mono font-bold">
              Station {activeSession?.deskNumber || 'Desk'} • {activeSession?.name || 'Verified Contender'}
            </span>
          </div>

        </div>
      )}
    </div>
  );
}
