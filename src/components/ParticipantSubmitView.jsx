import React, { useState, useEffect } from 'react';
import { useBattle } from '../context/BattleContext';
import ParticipantPollView from './ParticipantPollView';
import ParticipantQuizView from './ParticipantQuizView';
import ContenderAuthGate from './ContenderAuthGate';
import LockedProblemStatementWindow from './LockedProblemStatementWindow';
import { setupTabSwitchGuard } from '../lib/focusGuard';
import { analyzePromptEfficiency } from '../lib/scoringCalculator';
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
    reportTabSwitch,
    promptCheckerActive = false
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

  // Post-Battle Prompt & Token Efficiency Checker state
  const [checkerPrompt, setCheckerPrompt] = useState('');
  const [checkerDailyLimit, setCheckerDailyLimit] = useState('');
  const [checkerResult, setCheckerResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyzePrompt = (e) => {
    e.preventDefault();
    if (!checkerPrompt.trim()) return;
    setIsAnalyzing(true);
    setTimeout(() => {
      const dailyVal = Number(checkerDailyLimit) || Number(tokensUsed) || 0;
      const res = analyzePromptEfficiency(checkerPrompt, dailyVal);
      setCheckerResult(res);
      setIsAnalyzing(false);
    }, 350);
  };

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

                {/* 3. POST-BATTLE AI PROMPT & TOKEN EFFICIENCY CHECKER (Unlocked by Admin after battle) */}
                {promptCheckerActive ? (
                  <div className="p-5 sm:p-6 rounded-2xl border-2 border-purple-500/50 bg-gradient-to-b from-dark-900 via-dark-950 to-dark-950 shadow-[0_0_40px_rgba(168,85,247,0.25)] space-y-5 font-mono">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-purple-400 animate-pulse" />
                        <div>
                          <h2 className="text-base sm:text-lg font-bold font-sans text-white uppercase tracking-tight">
                            Post-Battle AI Prompt & Token Economy Checker
                          </h2>
                          <p className="text-[11px] text-slate-400">
                            Admin Activated • Benchmark your prompt AI efficiency, CoT depth, and token consumption
                          </p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-bold uppercase shrink-0">
                        Live AI Audit
                      </span>
                    </div>

                    <form onSubmit={handleAnalyzePrompt} className="space-y-4 text-xs">
                      <div>
                        <label className="block text-slate-300 font-bold mb-1 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-fest-cyan" />
                            <span>Paste Your Engineered Prompt / System Instructions *</span>
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            {checkerPrompt.length} chars • ~{Math.ceil(checkerPrompt.length / 3.8)} tokens
                          </span>
                        </label>
                        <textarea
                          rows={4}
                          required
                          value={checkerPrompt}
                          onChange={(e) => setCheckerPrompt(e.target.value)}
                          placeholder="Paste the full prompt instructions you engineered in Google Antigravity..."
                          className="w-full px-3.5 py-2.5 rounded-xl bg-dark-950 border border-white/15 focus:border-purple-400 text-white font-mono text-xs custom-scrollbar resize-y"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-bold mb-1 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-fest-pink" />
                            <span>Antigravity Daily Limit Used (%)</span>
                          </span>
                          <span className="text-[10px] text-fest-pink">
                            0% - 100% of Daily Quota
                          </span>
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={checkerDailyLimit}
                            onChange={(e) => setCheckerDailyLimit(e.target.value)}
                            placeholder={tokensUsed ? `${tokensUsed}%` : "e.g. 14.5"}
                            className="w-full pl-3.5 pr-8 py-2.5 rounded-xl bg-dark-950 border border-white/15 focus:border-purple-400 text-white font-mono text-sm"
                          />
                          <span className="absolute right-3.5 top-2.5 text-fest-pink font-bold font-mono text-sm pointer-events-none">%</span>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isAnalyzing || !checkerPrompt.trim()}
                        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-fest-pink to-fest-cyan text-white font-bold uppercase tracking-wider text-xs shadow-[0_0_20px_rgba(168,85,247,0.35)] flex items-center justify-center gap-2 hover:opacity-95 transition-all disabled:opacity-50"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>{isAnalyzing ? 'Auditing AI Prompt Logic...' : 'Run AI Prompt & Token Audit'}</span>
                      </button>
                    </form>

                    {checkerResult && (
                      <div className="p-4 sm:p-5 rounded-xl bg-dark-950 border border-purple-500/30 space-y-4 animate-in fade-in duration-200">
                        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
                          <div>
                            <span className="text-[10px] uppercase text-slate-400 tracking-wider block font-bold">
                              AI Efficiency Grade
                            </span>
                            <div className="text-xl sm:text-2xl font-black font-sans text-fest-gradient mt-0.5">
                              {checkerResult.grade}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] uppercase text-slate-400 tracking-wider block font-bold">
                              Composite Score
                            </span>
                            <span className="text-3xl font-black font-mono text-fest-cyan">
                              {checkerResult.totalScore}
                              <span className="text-sm font-normal text-slate-400">/100</span>
                            </span>
                          </div>
                        </div>

                        {/* 5-Criteria Rubric Breakdown */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                          <div className="p-2.5 rounded-lg bg-dark-900 border border-white/10">
                            <span className="text-[10px] text-slate-400 block">Chain-of-Thought</span>
                            <span className="font-bold text-fest-cyan text-sm">{checkerResult.cotScore}/25 pts</span>
                          </div>
                          <div className="p-2.5 rounded-lg bg-dark-900 border border-white/10">
                            <span className="text-[10px] text-slate-400 block">Schema Determinism</span>
                            <span className="font-bold text-fest-pink text-sm">{checkerResult.schemaScore}/25 pts</span>
                          </div>
                          <div className="p-2.5 rounded-lg bg-dark-900 border border-white/10">
                            <span className="text-[10px] text-slate-400 block">Constraint Anchoring</span>
                            <span className="font-bold text-fest-amber text-sm">{checkerResult.constraintScore}/20 pts</span>
                          </div>
                          <div className="p-2.5 rounded-lg bg-dark-900 border border-white/10">
                            <span className="text-[10px] text-slate-400 block">Anti-Injection Shield</span>
                            <span className="font-bold text-emerald-400 text-sm">{checkerResult.guardrailScore}/15 pts</span>
                          </div>
                          <div className="p-2.5 rounded-lg bg-dark-900 border border-white/10">
                            <span className="text-[10px] text-slate-400 block">Daily Limit Economy</span>
                            <span className="font-bold text-fest-pes text-sm">{checkerResult.tokenScore}/15 pts</span>
                          </div>
                          <div className="p-2.5 rounded-lg bg-dark-900 border border-white/10">
                            <span className="text-[10px] text-slate-400 block">Est. Model Tokens</span>
                            <span className="font-bold text-white text-sm">~{checkerResult.estimatedTokens} tokens</span>
                          </div>
                        </div>

                        {/* Strengths & Recommendations */}
                        <div className="space-y-2 pt-2 text-xs">
                          {checkerResult.strengths.length > 0 && (
                            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 space-y-1">
                              <span className="font-bold flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Identified Strengths:</span>
                              </span>
                              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-300">
                                {checkerResult.strengths.map((s, idx) => (
                                  <li key={idx}>{s}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {checkerResult.suggestions.length > 0 && (
                            <div className="p-3 rounded-lg bg-fest-amber/10 border border-fest-amber/20 text-fest-amber space-y-1">
                              <span className="font-bold flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-fest-amber" />
                                <span>Optimization Recommendations:</span>
                              </span>
                              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-300">
                                {checkerResult.suggestions.map((s, idx) => (
                                  <li key={idx}>{s}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-dark-900/60 border border-white/10 flex items-center justify-between text-xs font-mono text-slate-400">
                    <span className="flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5 text-slate-500" />
                      <span>Post-Battle AI Prompt & Token Efficiency Checker:</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-dark-950 border border-white/10 text-slate-400">
                      Locked (Admin triggers after battle)
                    </span>
                  </div>
                )}

                {/* 4. SUBMISSION CARD OR FORM */}
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
                        <span className="text-[10px] text-slate-400 block uppercase">Antigravity Daily Limit</span>
                        <span className="text-lg font-bold text-fest-pink block mt-0.5">{submittedData.tokensUsed}% Used</span>
                        <span className="text-[10px] text-emerald-400">Token Score: {submittedData.tokenScore || 0}/15 pts</span>
                      </div>
                    </div>

                    {/* INSTRUCTION TO STAY AT DESK */}
                    <div className="p-3.5 rounded-xl bg-fest-amber/10 border border-fest-amber/30 text-fest-amber text-xs font-mono max-w-md mx-auto text-left flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-fest-amber" />
                      <span>
                        <strong>Judge Evaluation In Progress:</strong> Organizers and judges will visit <strong>{submittedData.deskNumber || activeSession.deskNumber || 'your desk'}</strong> (Participant <strong>#{submittedData.participantId}</strong>) to inspect your prompt architecture and enter marks.
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
                    {/* Participant Profile Badge (Locked from Session) */}
                    <div className="p-3.5 rounded-xl bg-dark-950 border border-fest-cyan/30 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">Participant Profile</span>
                        <div className="text-sm font-bold text-white font-sans mt-0.5">
                          {activeSession.name} <span className="text-fest-pink font-mono text-xs font-normal">({activeSession.teamName || 'Solo Participant'})</span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded bg-fest-cyan/20 border border-fest-cyan/40 text-fest-cyan font-bold font-mono text-sm">
                        {activeSession.participantId}
                      </span>
                    </div>

                    {error && (
                      <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}

                    {/* Antigravity Daily Token Limit Used (%) Input */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-slate-200 font-bold flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-fest-pink" />
                          <span>Antigravity Daily Token Limit Used (%) *</span>
                        </label>
                        <span className="text-[10px] text-fest-pink font-bold">
                          0% - 100% of Daily Quota
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          required
                          value={tokensUsed}
                          onChange={(e) => setTokensUsed(e.target.value)}
                          placeholder="e.g. 15.5 (Check Antigravity daily limit % used)"
                          className="w-full pl-3.5 pr-8 py-2.5 rounded-lg bg-dark-950 border border-white/15 focus:border-fest-pink text-white font-mono text-sm"
                        />
                        <span className="absolute right-3.5 top-2.5 text-fest-pink font-bold font-mono text-sm pointer-events-none">%</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-fest-pink/10 border border-fest-pink/20 text-[11px] text-slate-300 space-y-1">
                        <p>
                          ℹ️ <strong>Antigravity Token Scoring (15 pts):</strong> The token mark is solely calculated from the percentage of your daily token limit consumed in Antigravity.
                        </p>
                        <p className="text-[10px] text-fest-pink font-mono">
                          Formula: Score = (100% - Used%) × 15 pts • 0% Used = 15/15 pts | 20% Used = 12/15 pts | 50% Used = 8/15 pts | 100% Used = 0 pts
                        </p>
                      </div>
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
