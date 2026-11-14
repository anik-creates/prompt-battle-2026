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
  Monitor, 
  Flame, 
  Vote, 
  HelpCircle, 
  AlertCircle,
  Radio
} from 'lucide-react';

export default function ParticipantSubmitView() {
  const { 
    activeArena, 
    timer, 
    submitParticipantWork, 
    switchView 
  } = useBattle();

  // Driven dynamically by activeArena from the Admin!
  const [currentTab, setCurrentTab] = useState(activeArena || 'battle');

  // When Admin changes active arena, automatically shift participant screen in real time!
  useEffect(() => {
    if (activeArena) {
      setCurrentTab(activeArena);
    }
  }, [activeArena]);

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

  return (
    <div className="w-full max-w-2xl mx-auto py-6 sm:py-10 px-4 space-y-6">
      
      {/* Live Director Broadcast Banner */}
      <div className="p-2.5 rounded-xl bg-dark-900 border border-white/10 flex items-center justify-between text-xs font-mono max-w-md mx-auto">
        <div className="flex items-center gap-2">
          <Radio className="w-3.5 h-3.5 text-fest-cyan animate-pulse" />
          <span className="text-slate-400">Moderator Broadcast:</span>
          <span className="font-bold text-white uppercase">
            {activeArena === 'poll' ? 'Live Poll' : activeArena === 'quiz' ? 'Kahoot Quiz' : 'Battle Submit'}
          </span>
        </div>

        {/* Optional quick switcher */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentTab('battle')}
            className={`p-1.5 rounded transition-all ${
              currentTab === 'battle'
                ? 'bg-fest-cyan/20 text-fest-cyan border border-fest-cyan/40'
                : 'text-slate-500 hover:text-white'
            }`}
            title="Battle Submission Form"
          >
            <Flame className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setCurrentTab('poll')}
            className={`p-1.5 rounded transition-all ${
              currentTab === 'poll'
                ? 'bg-fest-pink/20 text-fest-pink border border-fest-pink/40'
                : 'text-slate-500 hover:text-white'
            }`}
            title="Live Poll Screen"
          >
            <Vote className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setCurrentTab('quiz')}
            className={`p-1.5 rounded transition-all ${
              currentTab === 'quiz'
                ? 'bg-fest-amber/20 text-fest-amber border border-fest-amber/40'
                : 'text-slate-500 hover:text-white'
            }`}
            title="Kahoot Quiz Screen"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* RENDER CURRENT VIEW ACCORDING TO ADMIN BROADCAST */}
      {currentTab === 'poll' && <ParticipantPollView />}
      {currentTab === 'quiz' && <ParticipantQuizView />}

      {currentTab === 'battle' && (
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

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => switchView('presentation')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded bg-fest-cyan/15 hover:bg-fest-cyan/25 border border-fest-cyan/40 text-fest-cyan font-mono text-xs font-bold transition-all"
                >
                  <Monitor className="w-4 h-4" />
                  View Arena Screen
                </button>
                <button
                  onClick={handleReset}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded bg-dark-850 hover:bg-dark-800 border border-white/10 text-slate-300 font-mono text-xs transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Submit Another
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
