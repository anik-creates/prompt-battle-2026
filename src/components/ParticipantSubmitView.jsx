import React, { useState, useEffect } from 'react';
import { useBattle } from '../context/BattleContext';
import ParticipantPollView from './ParticipantPollView';
import ContenderAuthGate from './ContenderAuthGate';
import LockedProblemStatementWindow from './LockedProblemStatementWindow';
import { setupTabSwitchGuard } from '../lib/focusGuard';
import { 
  Send, 
  CheckCircle2, 
  Clock, 
  User, 
  Users, 
  FileText, 
  Sparkles, 
  RotateCcw, 
  AlertCircle,
  AlertTriangle,
  Radio,
  Flame,
  Vote,
  HelpCircle,
  Zap,
  Link,
  ShieldAlert,
  Lock,
  Copy,
  Check
} from 'lucide-react';

export default function ParticipantSubmitView({ isSimulator = false }) {
  const { 
    activeArena, 
    timer, 
    tokenBudget,
    participants = [],
    submitParticipantWork,
    registerPresence,
    reportTabSwitch,
    verificationPrompt
  } = useBattle();

  const [session, setSession] = useState(() => {
    try {
      const saved = localStorage.getItem('pb_contender_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isConfirmedReady, setIsConfirmedReady] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);
  const [error, setError] = useState('');
  const [copiedDirective, setCopiedDirective] = useState(false);

  // Check if participant already has a recorded submission in the global state
  const activeContenderSubmission = submittedData || (participants || []).find(
    (p) => p.participantId?.toUpperCase() === (session?.participantId || '').toUpperCase()
  );

  // Register presence whenever session or arena changes with recurring 20s heartbeat
  useEffect(() => {
    if (isSimulator) return; // Do not count admin simulator as a live mobile participant

    if (session) {
      const ping = () => {
        registerPresence({
          participantId: session.participantId,
          name: session.name,
          teamName: session.teamName,
          arena: activeArena,
        });
      };
      ping();
      const interval = setInterval(ping, 20000);
      return () => clearInterval(interval);
    }
  }, [isSimulator, session, activeArena, registerPresence]);

  // Anti-Cheat Tab Switch Protection
  useEffect(() => {
    if (isSimulator || activeArena !== 'battle' || !session) return;

    const cleanup = setupTabSwitchGuard({
      isSimulator,
      onTabSwitch: () => {
        if (!activeContenderSubmission) {
          reportTabSwitch({
            participantId: session.participantId,
            name: session.name,
            teamName: session.teamName,
            arena: 'battle',
          });
        }
      },
    });

    return cleanup;
  }, [isSimulator, activeArena, activeContenderSubmission, session, reportTabSwitch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!session) {
      setError('Please log in with your Participant ID first.');
      return;
    }
    if (!isConfirmedReady) {
      setError('Please check the confirmation box to verify your working is done and you are ready for judgment.');
      return;
    }
    setError('');

    const record = submitParticipantWork({
      participantId: session.participantId,
      name: session.name,
      teamName: session.teamName,
      deskNumber: session.deskNumber,
    });

    setSubmittedData(record);
  };

  // Determine stage title for status banner
  let stageLabel = 'Prompt Battle Submission Active';
  let stageIcon = <Flame className="w-3.5 h-3.5 text-fest-cyan" />;
  if (activeArena === 'poll') {
    stageLabel = 'Live Poll Active';
    stageIcon = <Vote className="w-3.5 h-3.5 text-fest-pink" />;
  }

  return (
    <div className="w-full max-w-2xl mx-auto py-4 sm:py-6 px-3 sm:px-4 space-y-5">
      
      {/* Outer Contender Authentication Gate with Designated Desk Confirmation */}
      <ContenderAuthGate onAuthenticated={setSession} isSimulator={isSimulator}>
        {(activeSession) => {
          const pId = activeSession?.participantId ? String(activeSession.participantId).toUpperCase() : '';
          const isInspectionUnlocked = Boolean(
            verificationPrompt?.globalUnlocked || 
            (verificationPrompt?.unlockedParticipants && (
              verificationPrompt.unlockedParticipants[pId] || 
              verificationPrompt.unlockedParticipants[activeSession?.participantId]
            ))
          );

          return (
            <div className="w-full space-y-5">
              {/* Live Stage Status Indicator (Synchronized with Admin) */}
              <div className="p-2.5 rounded-xl bg-dark-900 border border-white/10 flex items-center justify-between text-xs font-mono max-w-md mx-auto">
                <div className="flex items-center gap-2">
                  <Radio className="w-3.5 h-3.5 text-fest-cyan animate-pulse" />
                  <span className="text-slate-400">Live Stage:</span>
                  <span className="font-bold text-white uppercase flex items-center gap-1.5">
                    {stageIcon}
                    <span>{stageLabel}</span>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>Admin Synced</span>
                </div>
              </div>

              {/* DYNAMIC VIEW DRIVEN BY ADMIN PORTAL */}
              {activeArena === 'poll' && (
                <ParticipantPollView isSimulator={isSimulator} />
              )}

              {activeArena === 'battle' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-fest-pink/10 border border-fest-pink/30 text-fest-pink text-xs font-mono uppercase tracking-wider mb-2">
                      <Sparkles className="w-3.5 h-3.5 text-fest-pink" />
                      Prompt Battle Participant Portal
                    </div>

                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white font-sans tracking-tight">
                      PROMPT <span className="text-fest-gradient">BATTLE</span> 2026
                    </h1>
                    <p className="text-xs text-slate-400 font-mono mt-1">
                      IEEE PES DIU SBC • EEE FEST 2026
                    </p>
                  </div>

                  {/* 1. PROMINENT LIVE COMPETITION BATTLE CLOCK */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-dark-900 border-2 border-white/15 shadow-[0_0_35px_rgba(0,0,0,0.7)] text-center space-y-3 font-mono">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-slate-300">
                        <Clock className="w-4 h-4 text-fest-cyan" />
                        Competition Battle Time
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase flex items-center gap-1.5 ${
                        timer.status === 'running'
                          ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                          : timer.status === 'paused'
                          ? 'bg-fest-amber/15 border border-fest-amber/30 text-fest-amber'
                          : 'bg-white/10 text-slate-400'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${
                          timer.status === 'running' ? 'bg-emerald-400 animate-ping' : timer.status === 'paused' ? 'bg-fest-amber' : 'bg-slate-400'
                        }`}></span>
                        <span>{timer.status === 'running' ? 'Battle In Progress' : timer.status === 'paused' ? 'Battle Paused' : 'Standby'}</span>
                      </span>
                    </div>

                    {/* Big Countdown Digits */}
                    <div className="text-5xl sm:text-6xl font-black font-sans tracking-tight py-1">
                      <span className={
                        timer.remaining <= 120 && timer.status === 'running'
                          ? 'text-rose-500 animate-pulse drop-shadow-[0_0_20px_rgba(244,63,94,0.6)]'
                          : timer.status === 'running'
                          ? 'text-white drop-shadow-[0_0_25px_rgba(0,229,255,0.4)]'
                          : 'text-slate-400'
                      }>
                        {String(Math.floor((timer.remaining || 0) / 60)).padStart(2, '0')}:
                        {String((timer.remaining || 0) % 60).padStart(2, '0')}
                      </span>
                    </div>

                    {/* Visual Progress Bar */}
                    <div className="w-full h-2.5 rounded-full bg-dark-950 border border-white/10 overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ${
                          timer.remaining <= 120 ? 'bg-rose-500' : 'bg-gradient-to-r from-fest-cyan via-fest-pink to-fest-pes'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, ((timer.remaining || 0) / (timer.duration || 1200)) * 100))}%` }}
                      ></div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Battle Duration: {Math.floor((timer.duration || 1200) / 60)} mins</span>
                      <span>{timer.remaining > 0 ? `${Math.ceil((timer.remaining || 0) / 60)}m remaining` : "Time is up!"}</span>
                    </div>
                  </div>

                  {/* 2. LOCKED / RELEASED PROBLEM STATEMENT WINDOW */}
                  <LockedProblemStatementWindow activeSession={activeSession} isSimulator={isSimulator} />

                  {/* 3. SECRET JUDGE INSPECTION & AUDIT DIRECTIVE WINDOW */}
                  {isInspectionUnlocked ? (
                    <div className="p-5 sm:p-6 rounded-2xl border-2 border-emerald-500/50 bg-gradient-to-b from-dark-900 via-dark-950 to-dark-950 shadow-[0_0_40px_rgba(16,185,129,0.25)] space-y-4 font-mono">
                      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-white/10 gap-2">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
                          <div>
                            <h2 className="text-base sm:text-lg font-bold font-sans text-white uppercase tracking-tight">
                              Official Judge Verification Directive
                            </h2>
                            <p className="text-[11px] text-emerald-300/80">
                              Unlocked by Adjudicator • Ready for Google Antigravity inspection
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold uppercase shrink-0 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                            <span>Station Directive Unlocked</span>
                          </span>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs text-slate-300 space-y-2">
                        <p className="text-[11px] text-emerald-200">
                          <strong className="text-white">Adjudication Protocol:</strong> When the Judge visits your desk to evaluate your project, they will execute this prompt in your Google Antigravity chat to extract token metrics, CoT reasoning depth, and prompt efficiency.
                        </p>
                      </div>

                      {/* Prompt Display Box with One-Click Copy */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                            Inspection Directive Text:
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (navigator.clipboard) {
                                navigator.clipboard.writeText(verificationPrompt?.directive || '');
                                setCopiedDirective(true);
                                setTimeout(() => setCopiedDirective(false), 2500);
                              }
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-dark-950 font-bold text-xs shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all cursor-pointer"
                          >
                            {copiedDirective ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-dark-950" />
                                <span>Copied Directive!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-dark-950" />
                                <span>Copy Inspection Prompt</span>
                              </>
                            )}
                          </button>
                        </div>

                        <pre className="p-4 rounded-xl bg-dark-950 border border-white/15 text-slate-200 text-xs font-mono whitespace-pre-wrap select-all max-h-56 overflow-y-auto custom-scrollbar leading-relaxed">
                          {verificationPrompt?.directive}
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-dark-900/60 border border-white/10 flex items-center justify-between text-xs font-mono text-slate-400">
                      <span className="flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5 text-slate-500" />
                        <span>Judge Secret Verification Directive:</span>
                      </span>
                      <span className="text-[10px] px-2.5 py-1 rounded bg-dark-950 border border-white/10 text-slate-400">
                        Locked (Judge unlocks at your desk)
                      </span>
                    </div>
                  )}

                {/* 4. SUBMISSION CARD OR FORM */}
                {activeContenderSubmission ? (
                  /* SUBMISSION FINALIZED & LOCKED CONFIRMATION CARD (NO EDITS PERMITTED) */
                  <div className="p-6 sm:p-8 rounded-2xl border-2 border-emerald-500/50 bg-gradient-to-b from-dark-900 via-dark-950 to-dark-950 shadow-[0_0_50px_rgba(16,185,129,0.25)] text-center space-y-6">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>

                    <div className="space-y-1">
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-sans uppercase tracking-tight">
                        Work Submitted & Time Locked!
                      </h2>
                      <p className="text-xs sm:text-sm text-emerald-300 font-mono">
                        Your completion time has been officially recorded. Submission is finalized.
                      </p>
                    </div>

                    {/* PROMINENT PARTICIPANT ID & DESIGNATED DESK STATION BADGE */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-dark-950 border-2 border-fest-amber/40 max-w-sm mx-auto shadow-inner space-y-2">
                      <span className="text-[10px] uppercase font-mono text-slate-400 tracking-widest block font-bold">
                        YOUR DESIGNATED DESK STATION
                      </span>
                      <span className="text-3xl sm:text-4xl font-mono font-black text-fest-amber tracking-wider block drop-shadow-[0_0_15px_rgba(255,183,0,0.5)]">
                        {activeContenderSubmission.deskNumber || activeSession.deskNumber || 'Desk Station'}
                      </span>
                      <div className="flex items-center justify-center gap-2 pt-1 text-xs text-slate-300">
                        <span className="px-2 py-0.5 rounded bg-fest-cyan/15 text-fest-cyan border border-fest-cyan/30 font-bold">
                          ID: {activeContenderSubmission.participantId}
                        </span>
                        <span className="text-white/20">•</span>
                        <span className="text-fest-pink">{activeContenderSubmission.name}</span>
                      </div>
                    </div>

                    {/* STATS BREAKDOWN GRID */}
                    <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto font-mono text-xs">
                      <div className="p-3 rounded-lg bg-dark-900 border border-white/10 text-left">
                        <span className="text-[10px] text-slate-400 block uppercase">Finish Time</span>
                        <span className="text-lg font-bold text-white block mt-0.5">{activeContenderSubmission.finishTimeFormatted}</span>
                        <span className="text-[10px] text-emerald-400 font-bold">Time Score: {activeContenderSubmission.timeScore ?? 10}/10 pts</span>
                      </div>

                      <div className="p-3 rounded-lg bg-dark-900 border border-white/10 text-left">
                        <span className="text-[10px] text-slate-400 block uppercase">Adjudication</span>
                        <span className="text-sm font-bold text-fest-cyan block mt-1">Ready for Judges</span>
                        <span className="text-[10px] text-slate-400">Desk Evaluation</span>
                      </div>
                    </div>

                    {/* IN-PERSON DESK VISIT INSTRUCTIONS */}
                    <div className="p-4 rounded-xl bg-fest-amber/10 border border-fest-amber/30 text-fest-amber text-xs font-mono max-w-md mx-auto text-left space-y-2">
                      <div className="flex items-center gap-2 font-bold text-white">
                        <AlertCircle className="w-4 h-4 text-fest-amber shrink-0" />
                        <span>Next Step: In-Person Desk Judgment</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        Please keep your <strong>Google Antigravity project and chat session open</strong> on your computer screen. An official judge will arrive at <strong>{activeContenderSubmission.deskNumber || activeSession.deskNumber || 'your desk'}</strong> to inspect your prompt architecture, run the verification directive, and score your project.
                      </p>
                    </div>

                    {/* LOCKED PERMANENT NOTICE (NO EDIT BUTTON) */}
                    <div className="pt-2">
                      <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-dark-950 border border-white/15 text-slate-400 font-mono text-xs">
                        <Lock className="w-3.5 h-3.5 text-fest-amber" />
                        <span>Submission Finalized • Editing Disabled</span>
                      </span>
                    </div>
                  </div>
                ) : (
                  /* SUBMISSION FORM (NO QUESTIONS - ANIMATED WARNING & READY CHECKBOX ONLY) */
                  <form onSubmit={handleSubmit} className="space-y-5 border border-white/10 p-5 sm:p-7 rounded-2xl bg-dark-900/70 font-mono text-xs">
                    {/* Participant Profile Badge (Locked from Session) */}
                    <div className="p-3.5 rounded-xl bg-dark-950 border border-fest-cyan/30 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">Participant Profile</span>
                        <div className="text-sm font-bold text-white font-sans mt-0.5">
                          {activeSession.name} <span className="text-fest-pink font-mono text-xs font-normal">({activeSession.teamName || 'Solo Participant'})</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded bg-fest-amber/15 border border-fest-amber/40 text-fest-amber font-bold font-mono text-xs">
                          {activeSession.deskNumber || 'Desk Station'}
                        </span>
                        <span className="px-2.5 py-1 rounded bg-fest-cyan/20 border border-fest-cyan/40 text-fest-cyan font-bold font-mono text-sm">
                          {activeSession.participantId}
                        </span>
                      </div>
                    </div>

                    {error && (
                      <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}

                    {/* ANIMATED WARNING BANNER: IRREVERSIBLE SUBMISSION (CANNOT BE EDITED ONCE SUBMITTED) */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-950/40 via-dark-950 to-dark-950 border-2 border-rose-500/60 shadow-[0_0_30px_rgba(244,63,94,0.25)] space-y-2 animate-pulse">
                      <div className="flex items-center gap-2.5 text-rose-400">
                        <AlertTriangle className="w-5 h-5 shrink-0" />
                        <span className="font-bold font-sans uppercase tracking-wider text-sm sm:text-base text-rose-200">
                          Permanent Submission Warning
                        </span>
                      </div>
                      <p className="text-xs text-rose-200/90 leading-relaxed font-mono">
                        ⚠️ <strong>CRITICAL:</strong> Once you submit, your battle finish time will be <strong>permanently locked</strong> and <strong>CANNOT BE EDITED OR RE-SUBMITTED</strong>. Your automated Time Management score (10 pts) will be computed based on this exact timestamp. Ensure your Google Antigravity project is fully complete before submitting.
                      </p>
                    </div>

                    {/* CONFIRMATION CHECKBOX TO CONFIRM WORKING IS DONE */}
                    <div 
                      onClick={() => setIsConfirmedReady(!isConfirmedReady)}
                      className={`p-4 sm:p-5 rounded-xl border-2 transition-all cursor-pointer select-none ${
                        isConfirmedReady 
                          ? 'bg-fest-cyan/10 border-fest-cyan/70 shadow-[0_0_25px_rgba(0,229,255,0.25)]' 
                          : 'bg-dark-950 border-white/15 hover:border-white/30'
                      }`}
                    >
                      <label className="flex items-start gap-3.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isConfirmedReady}
                          onChange={(e) => setIsConfirmedReady(e.target.checked)}
                          className="mt-1 w-5 h-5 rounded border-white/20 text-fest-cyan accent-fest-cyan cursor-pointer shrink-0"
                        />
                        <div className="space-y-1">
                          <span className="font-bold text-white text-xs sm:text-sm block font-sans">
                            I confirm my working is done and I am ready for judgment.
                          </span>
                          <span className="text-[11px] text-slate-400 block font-mono leading-relaxed">
                            My project in Google Antigravity is complete, active on my screen, and I am ready for the faculty judges to visit my desk for final evaluation.
                          </span>
                        </div>
                      </label>
                    </div>

                    {/* SUBMIT BUTTON (LOCKED UNTIL CHECKBOX CHECKED) */}
                    <button
                      type="submit"
                      disabled={!isConfirmedReady || timer.status !== 'running'}
                      className={`w-full py-4 px-4 rounded-xl font-bold uppercase tracking-wider text-xs sm:text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                        isConfirmedReady && timer.status === 'running'
                          ? 'bg-gradient-to-r from-fest-pink via-purple-600 to-fest-cyan text-white shadow-[0_0_30px_rgba(0,229,255,0.4)] hover:opacity-95 cursor-pointer transform hover:-translate-y-0.5'
                          : 'bg-dark-950 border border-white/10 text-slate-500 cursor-not-allowed opacity-60'
                      }`}
                    >
                      <Send className="w-4 h-4" />
                      <span>
                        {timer.status !== 'running'
                          ? 'Battle Not In Progress'
                          : isConfirmedReady
                          ? 'Lock Finish Time & Submit Battle Work →'
                          : 'Check Confirmation Box Above To Enable Submit'}
                      </span>
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        );
      }}
    </ContenderAuthGate>
  </div>
);
}
