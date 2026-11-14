import React, { useState, useEffect } from 'react';
import { useBattle } from '../context/BattleContext';
import ParticipantPollView from './ParticipantPollView';
import ParticipantQuizView from './ParticipantQuizView';
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
  HelpCircle
} from 'lucide-react';

export default function ParticipantSubmitView() {
  const { 
    activeArena, 
    timer, 
    submitParticipantWork 
  } = useBattle();

  const [name, setName] = useState('');
  const [teamName, setTeamName] = useState('');
  const [notes, setNotes] = useState('');
  const [submittedData, setSubmittedData] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide your name or participant handle.');
      return;
    }
    setError('');

    const record = submitParticipantWork({
      name: name.trim(),
      teamName: teamName.trim() || 'Independent Contender',
      notes: notes.trim(),
    });

    setSubmittedData(record);
  };

  const handleReset = () => {
    setSubmittedData(null);
    setName('');
    setTeamName('');
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
    <div className="w-full max-w-2xl mx-auto py-6 sm:py-8 px-4 space-y-6">
      
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
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
      </div>

      {/* DYNAMIC VIEW DRIVEN BY ADMIN PORTAL */}
      {activeArena === 'poll' && <ParticipantPollView />}
      
      {activeArena === 'quiz' && <ParticipantQuizView />}

      {activeArena === 'battle' && (
        <div className="space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-fest-pink/10 border border-fest-pink/30 text-fest-pink text-xs font-mono uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5 text-fest-pink" />
              Participant Battle Submission
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-sans tracking-tight">
              PROMPT <span className="text-fest-gradient">BATTLE</span> SUBMIT
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-1.5">
              IEEE PES DIU SBC • EEE FEST 2026
            </p>
          </div>

          {submittedData ? (
            <div className="p-6 sm:p-8 rounded-lg border border-emerald-500/40 bg-dark-900/90 shadow-[0_0_30px_rgba(16,185,129,0.15)] text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white font-sans">
                  Submission Successful!
                </h2>
                <p className="text-sm text-slate-300 font-mono mt-1">
                  Your finish timestamp has been locked and broadcasted to the arena.
                </p>
              </div>

              <div className="p-4 rounded bg-dark-950 border border-white/10 max-w-sm mx-auto">
                <span className="text-xs uppercase font-mono text-slate-400 tracking-widest block">
                  Time Recorded
                </span>
                <span className="text-3xl font-mono font-extrabold text-fest-cyan mt-1 block">
                  {submittedData.finishTimeFormatted}
                </span>
              </div>

              <div className="text-xs font-mono text-slate-400 space-y-1.5 max-w-sm mx-auto text-left border-t border-white/10 pt-4">
                <div className="flex justify-between">
                  <span>Contender:</span>
                  <span className="text-white font-semibold">{submittedData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Team:</span>
                  <span className="text-fest-pink font-semibold">{submittedData.teamName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Timestamp:</span>
                  <span className="text-slate-300">{new Date(submittedData.submittedAt).toLocaleTimeString()}</span>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-center">
                <button
                  onClick={handleReset}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded bg-dark-850 hover:bg-dark-800 border border-white/10 text-slate-300 font-mono text-xs transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Submit Another Contender</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 border border-white/10 p-6 sm:p-8 rounded-lg bg-dark-900/60">
              <div className="flex items-center justify-between p-3 rounded bg-dark-950 border border-white/10 font-mono text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-fest-cyan" />
                  Arena Timer Status:
                </span>
                <span className={`font-bold ${
                  timer.status === 'running' ? 'text-emerald-400 animate-pulse' : 'text-amber-400'
                }`}>
                  {timer.status === 'running' ? 'Battle Active' : timer.status === 'paused' ? 'Paused' : 'Standby'}
                </span>
              </div>

              {error && (
                <div className="p-3 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 font-mono text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-xs uppercase font-mono tracking-wider text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-fest-cyan" />
                  Participant Full Name <span className="text-fest-pink">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Tanvir Mahmud"
                  className="w-full px-4 py-3 rounded bg-dark-950 border border-white/15 focus:border-fest-cyan text-white text-sm font-sans placeholder-slate-400 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs uppercase font-mono tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-fest-pink" />
                  Team Name / ID (Optional)
                </label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g. DIU Prompt Masters / Solo"
                  className="w-full px-4 py-3 rounded bg-dark-950 border border-white/15 focus:border-fest-pink text-white text-sm font-sans placeholder-slate-400 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs uppercase font-mono tracking-wider text-slate-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-fest-amber" />
                  Prompt Technique / Solution Summary (Optional)
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Briefly describe your strategy, constraints applied, or output format..."
                  className="w-full px-4 py-3 rounded bg-dark-950 border border-white/15 focus:border-fest-amber text-white text-sm font-sans placeholder-slate-400 transition-colors resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-4 px-6 rounded-lg bg-gradient-to-r from-fest-pink via-purple-600 to-fest-cyan text-white font-mono text-base font-bold uppercase tracking-wider transition-all duration-300 hover:opacity-95 shadow-[0_0_25px_rgba(255,0,122,0.4)] flex items-center justify-center gap-2 group"
                >
                  <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  <span>I Have Finished — Submit Time</span>
                </button>
                <p className="text-center text-[11px] font-mono text-slate-400 mt-2">
                  Clicking will immediately register your completion timestamp on the main presentation display.
                </p>
              </div>
            </form>
          )}
        </div>
      )}

    </div>
  );
}
