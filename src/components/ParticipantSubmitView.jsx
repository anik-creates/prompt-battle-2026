import React, { useState, useEffect } from 'react';
import { useBattle } from '../context/BattleContext';
import ParticipantPollView from './ParticipantPollView';
import ParticipantQuizView from './ParticipantQuizView';
import ContenderAuthGate from './ContenderAuthGate';
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
  Radio,
  Flame,
  Vote,
  HelpCircle,
  Zap,
  Link,
  ShieldAlert
} from 'lucide-react';

export default function ParticipantSubmitView({ isSimulator = false }) {
  const { 
    activeArena, 
    timer, 
    tokenBudget,
    submitParticipantWork,
    registerPresence,
    reportTabSwitch
  } = useBattle();

  const [session, setSession] = useState(() => {
    try {
      const saved = localStorage.getItem('pb_contender_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [tokensUsed, setTokensUsed] = useState('');
  const [workUrl, setWorkUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [submittedData, setSubmittedData] = useState(null);
  const [error, setError] = useState('');

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
        if (!submittedData) {
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
  }, [isSimulator, activeArena, submittedData, session, reportTabSwitch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!session) {
      setError('Please log in with your Participant ID first.');
      return;
    }
    setError('');

    const record = submitParticipantWork({
      participantId: session.participantId,
      name: session.name,
      teamName: session.teamName,
      deskNumber: session.deskNumber,
      tokensUsed: Number(tokensUsed) || 0,
      workUrl: workUrl.trim(),
      notes: notes.trim(),
    });

    setSubmittedData(record);
  };

  const handleReset = () => {
    setSubmittedData(null);
    setTokensUsed('');
    setWorkUrl('');
    setNotes('');
  };

  // Determine stage title for status banner
  let stageLabel = 'Prompt Battle Submission Active';
  let stageIcon = <Flame className="w-3.5 h-3.5 text-fest-cyan" />;
  if (activeArena === 'poll') {
    stageLabel = 'Live Poll Active';
    stageIcon = <Vote className="w-3.5 h-3.5 text-fest-pink" />;
  } else if (activeArena === 'quiz') {
    stageLabel = 'Kahoot Quiz Active';
    stageIcon = <HelpCircle className="w-3.5 h-3.5 text-fest-amber" />;
  }

  return (
    <div className="w-full max-w-2xl mx-auto py-4 sm:py-6 px-3 sm:px-4 space-y-5">
      
      {/* Outer Contender Authentication Gate with Designated Desk Confirmation */}
      <ContenderAuthGate onAuthenticated={setSession} isSimulator={isSimulator}>
        {(activeSession) => (
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
            
            {activeArena === 'quiz' && (
              <ParticipantQuizView isSimulator={isSimulator} />
            )}

            {activeArena === 'battle' && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-fest-pink/10 border border-fest-pink/30 text-fest-pink text-xs font-mono uppercase tracking-wider mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-fest-pink" />
                    Prompt Battle Submission Portal
                  </div>

                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white font-sans tracking-tight">
                    PROMPT <span className="text-fest-gradient">BATTLE</span> 2026
                  </h1>
                  <p className="text-xs text-slate-400 font-mono mt-1">
                    IEEE PES DIU SBC • EEE FEST 2026
                  </p>
                </div>

                {submittedData ? (
                  /* SUBMISSION SUCCESSFUL CONFIRMATION CARD */
                  <div className="p-6 sm:p-8 rounded-2xl border-2 border-fest-cyan/50 bg-gradient-to-b from-dark-900 via-dark-950 to-dark-950 shadow-[0_0_50px_rgba(0,229,255,0.2)] text-center space-y-6">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>

                    <div className="space-y-1">
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-sans uppercase tracking-tight">
                        Submission Recorded!
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-300 font-mono">
                        Your finish time and tokens have been recorded. Please remain at your desk station.
                      </p>
                    </div>

                    {/* PROMINENT PARTICIPANT ID & DESIGNATED DESK STATION BADGE */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-dark-950 border-2 border-fest-amber/40 max-w-sm mx-auto shadow-inner space-y-2">
                      <span className="text-[10px] uppercase font-mono text-slate-400 tracking-widest block font-bold">
                        YOUR DESIGNATED DESK STATION
                      </span>
                      <span className="text-3xl sm:text-4xl font-mono font-black text-fest-amber tracking-wider block drop-shadow-[0_0_15px_rgba(255,183,0,0.5)]">
                        {submittedData.deskNumber || activeSession.deskNumber || 'Desk Station'}
                      </span>
                      <div className="flex items-center justify-center gap-2 pt-1 text-xs text-slate-300">
                        <span className="px-2 py-0.5 rounded bg-fest-cyan/15 text-fest-cyan border border-fest-cyan/30 font-bold">
                          ID: {submittedData.participantId}
                        </span>
                        <span className="text-white/20">•</span>
                        <span className="text-fest-pink">{submittedData.name}</span>
                      </div>
                    </div>

                    {/* STATS BREAKDOWN GRID */}
                    <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto font-mono text-xs">
                      <div className="p-3 rounded-lg bg-dark-900 border border-white/10 text-left">
                        <span className="text-[10px] text-slate-400 block uppercase">Finish Time</span>
                        <span className="text-lg font-bold text-white block mt-0.5">{submittedData.finishTimeFormatted}</span>
                        <span className="text-[10px] text-emerald-400">Time Score: {submittedData.timeScore || 0}/15</span>
                      </div>

                      <div className="p-3 rounded-lg bg-dark-900 border border-white/10 text-left">
                        <span className="text-[10px] text-slate-400 block uppercase">Tokens Consumed</span>
                        <span className="text-lg font-bold text-fest-pink block mt-0.5">{submittedData.tokensUsed}</span>
                        <span className="text-[10px] text-emerald-400">Token Score: {submittedData.tokenScore || 0}/15</span>
                      </div>
                    </div>

                    {/* INSTRUCTION TO STAY AT DESK */}
                    <div className="p-3.5 rounded-xl bg-fest-amber/10 border border-fest-amber/30 text-fest-amber text-xs font-mono max-w-md mx-auto text-left flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-fest-amber" />
                      <span>
                        <strong>Judge Evaluation In Progress:</strong> Organizers and judges will visit <strong>{submittedData.deskNumber || activeSession.deskNumber || 'your desk'}</strong> (Contender <strong>#{submittedData.participantId}</strong>) to inspect your prompt architecture and enter marks.
                      </span>
                    </div>

                    <div className="pt-2 flex items-center justify-center">
                      <button
                        onClick={handleReset}
                      className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-dark-850 hover:bg-dark-800 border border-white/10 text-slate-300 font-mono text-xs transition-all"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Edit Submission</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* SUBMISSION FORM */
                <form onSubmit={handleSubmit} className="space-y-5 border border-white/10 p-5 sm:p-7 rounded-2xl bg-dark-900/70 font-mono text-xs">
                  {/* Timer Bar */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-dark-950 border border-white/10">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-fest-cyan" />
                      Battle Clock Status:
                    </span>
                    <span className={`font-bold ${
                      timer.status === 'running' ? 'text-emerald-400 animate-pulse' : 'text-amber-400'
                    }`}>
                      {timer.status === 'running' ? 'Timer Running' : timer.status === 'paused' ? 'Paused' : 'Standby'}
                    </span>
                  </div>

                  {error && (
                    <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Contender ID & Name Badge (Locked from Session) */}
                  <div className="p-3.5 rounded-xl bg-dark-950 border border-fest-cyan/30 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest block">Contender Profile</span>
                      <div className="text-sm font-bold text-white font-sans mt-0.5">
                        {activeSession.name} <span className="text-fest-pink font-mono text-xs font-normal">({activeSession.teamName})</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-fest-cyan/20 border border-fest-cyan/40 text-fest-cyan font-bold font-mono text-sm">
                      {activeSession.participantId}
                    </span>
                  </div>

                  {/* Tokens Consumed Input (With Formula Penalty Explanation) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-slate-200 font-bold flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-fest-pink" />
                        <span>Tokens Consumed *</span>
                      </label>
                      <span className="text-[10px] text-fest-pink">
                        Benchmark: {tokenBudget || 2000} Tokens
                      </span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      required
                      value={tokensUsed}
                      onChange={(e) => setTokensUsed(e.target.value)}
                      placeholder="e.g. 450 (Check model info tab or token count)"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-dark-950 border border-white/15 focus:border-fest-pink text-white font-mono text-sm"
                    />
                    <p className="text-[10px] text-slate-400">
                      ℹ️ <strong>Token Efficiency Scoring:</strong> Lower token usage yields a higher score (up to 15 points). Excessive token consumption incurs a percentage penalty.
                    </p>
                  </div>

                  {/* Work URL / Prompt Link */}
                  <div className="space-y-1.5">
                    <label className="text-slate-200 font-bold flex items-center gap-1.5">
                      <Link className="w-3.5 h-3.5 text-fest-cyan" />
                      <span>Prompt Share Link or Drive URL (Optional)</span>
                    </label>
                    <input
                      type="url"
                      value={workUrl}
                      onChange={(e) => setWorkUrl(e.target.value)}
                      placeholder="e.g. https://chatgpt.com/share/... or Google Drive link"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-dark-950 border border-white/15 focus:border-fest-cyan text-white text-xs font-mono"
                    />
                  </div>

                  {/* Prompt Technique / Notes */}
                  <div className="space-y-1.5">
                    <label className="text-slate-200 font-bold flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-fest-amber" />
                      <span>Prompt Engineering Technique / Framework (Optional)</span>
                    </label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. CoT + Persona Anchoring with constrained JSON verification..."
                      className="w-full px-3.5 py-2 rounded-lg bg-dark-950 border border-white/15 focus:border-fest-amber text-white text-xs font-mono resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-fest-pink via-purple-600 to-fest-cyan text-white font-bold uppercase tracking-wider text-xs shadow-[0_0_25px_rgba(255,0,122,0.4)] flex items-center justify-center gap-2 hover:opacity-95 transition-all"
                  >
                    <Send className="w-4 h-4" />
                    <span>Lock Finish Time & Submit Battle Work</span>
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      )}
    </ContenderAuthGate>
  </div>
);
}
