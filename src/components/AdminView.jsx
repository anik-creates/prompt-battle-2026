import React, { useState } from 'react';
import { useBattle } from '../context/BattleContext';
import TimerDisplay from './TimerDisplay';
import FirebaseModal from './FirebaseModal';
import ParticipantSubmitView from './ParticipantSubmitView';
import ContenderRosterManager from './ContenderRosterManager';
import { 
  ShieldCheck, 
  Lock, 
  Key, 
  Clock, 
  Play, 
  Pause, 
  RotateCcw, 
  Trophy, 
  Eye, 
  EyeOff, 
  Cloud, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Plus, 
  Download, 
  Upload, 
  LogOut, 
  Save, 
  Edit3, 
  Sparkles,
  Users,
  Flame,
  Vote,
  HelpCircle,
  Zap,
  ArrowRight,
  Radio,
  Check,
  Smartphone,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  List,
  BarChart3,
  FileCode,
  MapPin,
  Scale,
  Mail
} from 'lucide-react';

export default function AdminView() {
  const { 
    activeArena,
    switchArena,
    switchView,
    timer, 
    participants, 
    published, 
    poll,
    quiz,
    totalJoinedCount,
    setPollDisplayMode,
    joinedParticipants,
    clearAllPresence,
    isAdminAuthenticated, 
    authenticateAdmin, 
    logoutAdmin,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    updateParticipantMarks,
    addManualParticipant,
    removeParticipant,
    togglePublishLeaderboard,
    createPoll,
    setPollStatus,
    publishPollResults,
    resetPoll,
    launchQuizQuestion,
    endQuizQuestion,
    publishQuizLeaderboard,
    resetQuiz,
    addQuizQuestion,
    updateQuizQuestion,
    deleteQuizQuestion,
    updatePoll,
    deletePoll,
    tokenBudget,
    resetAllData,
    firebaseStatus,
    judges = [],
    deleteJudge,
    registeredContenders = []
  } = useBattle();

  // Admin Section Tab: 'battle' | 'roster' | 'judges' | 'poll' | 'quiz'
  const [adminTab, setAdminTab] = useState('battle');
  const [showMobileSimulator, setShowMobileSimulator] = useState(false);
  const [evaluationViewMode, setEvaluationViewMode] = useState('table'); // 'table' | 'cards'

  // Edit Quiz Question Modal State
  const [editingQuizQ, setEditingQuizQ] = useState(null);

  // Edit Poll Modal State
  const [editingPollModal, setEditingPollModal] = useState(null);

  // Login form state
  const [adminEmailInput, setAdminEmailInput] = useState('pes.ieee@diu.edu.bd');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');

  // Timer custom duration state
  const [customMinutes, setCustomMinutes] = useState(20);

  // Manual participant add state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newManualName, setNewManualName] = useState('');
  const [newManualTeam, setNewManualTeam] = useState('');
  const [newManualTime, setNewManualTime] = useState('10m 00s');

  // Firebase modal state
  const [isFirebaseOpen, setIsFirebaseOpen] = useState(false);

  // Poll Form State
  const [newPollQuestion, setNewPollQuestion] = useState('');
  const [newPollType, setNewPollType] = useState('mcq');
  const [newPollOptions, setNewPollOptions] = useState([
    { text: '', isCorrect: true },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ]);

  // Quiz Form State
  const [newQText, setNewQText] = useState('');
  const [newQOpts, setNewQOpts] = useState(['', '', '', '']);
  const [newQCorrect, setNewQCorrect] = useState(0);
  const [newQTime, setNewQTime] = useState(20);

  const handleLogin = (e) => {
    e.preventDefault();
    const res = authenticateAdmin(adminEmailInput, passwordInput);
    if (!res.success) {
      setAuthError(res.error);
    } else {
      setAuthError('');
      setPasswordInput('');
    }
  };

  const handleSetPreset = (minutes) => {
    setCustomMinutes(minutes);
    resetTimer(minutes * 60);
  };

  const handleApplyCustomMinutes = () => {
    const mins = Math.max(1, parseInt(customMinutes) || 1);
    resetTimer(mins * 60);
  };

  const handleAddManual = (e) => {
    e.preventDefault();
    if (!newManualName.trim()) return;

    addManualParticipant({
      name: newManualName.trim(),
      teamName: newManualTeam.trim() || 'Solo Contender',
      finishTimeFormatted: newManualTime.trim() || '12m 00s',
      finishSeconds: 720,
      tokensUsed: 500,
      objectiveScore: 25,
      finishStatus: 'Fully Completed',
      finishStatusNotes: 'Manual entry',
      presentationScore: 20,
      noveltyScore: 20,
      totalScore: 85,
    });

    setNewManualName('');
    setNewManualTeam('');
    setShowAddModal(false);
  };

  const handleCreatePoll = (e) => {
    e.preventDefault();
    if (!newPollQuestion.trim()) return;
    const validOptions = newPollOptions.filter(o => o.text.trim());
    if (validOptions.length < 2) {
      alert('Please provide at least 2 options for the poll.');
      return;
    }

    createPoll({
      question: newPollQuestion.trim(),
      type: newPollType,
      options: validOptions,
    });

    setNewPollQuestion('');
  };

  const handleAddQuestion = (e) => {
    e.preventDefault();
    if (!newQText.trim()) return;
    addQuizQuestion({
      question: newQText.trim(),
      options: newQOpts.map(o => o.trim() || 'Option'),
      correctIndex: newQCorrect,
      timeLimit: newQTime,
    });
    setNewQText('');
    setNewQOpts(['', '', '', '']);
  };

  const exportToCSV = () => {
    if (participants.length === 0) {
      alert('No participant records to export.');
      return;
    }

    const headers = [
      'Rank', 'Name', 'Team', 'Finish Time', 'Tokens Used',
      'Objective Score (30)', 'Finish Status', 'Presentation Score (25)',
      'Novelty Score (25)', 'Total Score (100)'
    ];

    const sorted = [...participants].sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));

    const rows = sorted.map((p, idx) => [
      idx + 1,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.teamName.replace(/"/g, '""')}"`,
      `"${p.finishTimeFormatted || ''}"`,
      p.tokensUsed || 0,
      p.objectiveScore || 0,
      `"${p.finishStatus || ''}"`,
      p.presentationScore || 0,
      p.noveltyScore || 0,
      p.totalScore || 0
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `prompt_battle_results_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // IF NOT AUTHENTICATED: Display Login Screen
  if (!isAdminAuthenticated) {
    return (
      <div className="w-full max-w-md mx-auto py-16 px-4">
        <div className="border border-white/10 p-8 rounded-lg bg-dark-900/90 shadow-[0_0_35px_rgba(0,0,0,0.8)] text-center">
          
          <div className="w-14 h-14 rounded-full bg-fest-pes/20 border border-fest-pes/40 text-fest-pes flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6" />
          </div>

          <h2 className="text-2xl font-bold font-sans text-white">
            Admin Portal Access
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1 mb-6">
            IEEE PES DIU SBC • EEE FEST 2026 Prompt Battle
          </p>

          {authError && (
            <div className="p-3 mb-4 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 font-mono text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label className="block text-xs uppercase font-mono tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-fest-cyan" />
                Admin Official Gmail
              </label>
              <input
                type="email"
                required
                value={adminEmailInput}
                onChange={(e) => setAdminEmailInput(e.target.value)}
                placeholder="pes.ieee@diu.edu.bd"
                className="w-full px-4 py-2.5 rounded bg-dark-950 border border-white/15 focus:border-fest-pes focus:ring-1 focus:ring-fest-pes text-white text-sm font-mono placeholder-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs uppercase font-mono tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-fest-pes" />
                Admin Secret Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter administrator password..."
                  className="w-full px-4 py-2.5 rounded bg-dark-950 border border-white/15 focus:border-fest-pes focus:ring-1 focus:ring-fest-pes text-white text-sm font-mono placeholder-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-1.5">
                <span>Pass: <code className="text-fest-pes font-bold">PesDiuSbc2026</code></span>
                <button
                  type="button"
                  onClick={() => {
                    setAdminEmailInput('pes.ieee@diu.edu.bd');
                    setPasswordInput('PesDiuSbc2026');
                  }}
                  className="text-fest-cyan hover:underline text-[10px] font-semibold uppercase tracking-wider"
                >
                  ⚡ Auto-Fill Credentials
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded bg-gradient-to-r from-fest-pes to-emerald-600 hover:from-fest-pes/90 hover:to-emerald-500 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(108,179,63,0.3)] flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Unlock Admin Panel</span>
            </button>

            <button
              type="button"
              onClick={() => switchView('presentation')}
              className="w-full text-center text-xs font-mono text-slate-400 hover:text-white pt-2 transition-colors block"
            >
              ← Return to Presentation Screen
            </button>
          </form>

        </div>
      </div>
    );
  }

  // Smartphone frame simulator renderer
  const renderPhoneSimulator = () => (
    <div className="w-full max-w-[340px] 2xl:max-w-[360px] mx-auto rounded-[44px] p-3.5 bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 shadow-[0_0_50px_rgba(0,0,0,0.95)] border-4 border-slate-600">
      <div className="rounded-[34px] bg-dark-950 overflow-hidden border border-white/15 relative h-[620px] 2xl:h-[660px] flex flex-col shadow-inner">
        {/* Smartphone Top Notch / Speaker */}
        <div className="pt-2.5 pb-1 bg-dark-950 flex items-center justify-between px-5 border-b border-white/5 select-none shrink-0">
          <span className="text-[10px] font-mono text-slate-400">9:41</span>
          <div className="w-20 h-3.5 rounded-full bg-black border border-white/15 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-slate-900 border border-white/10 mr-1.5"></div>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 font-bold">5G</span>
        </div>

        {/* Live Broadcast Pill Inside Phone */}
        <div className="px-3 py-1 bg-dark-900/90 border-b border-white/5 flex items-center justify-between text-[10px] font-mono shrink-0">
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-fest-cyan animate-pulse"></span>
            <span>Mirrored Phone Screen</span>
          </span>
          <span className="text-fest-cyan font-bold uppercase">{activeArena}</span>
        </div>

        {/* Mobile Screen Content (Live View with isSimulator={true}) */}
        <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
          <ParticipantSubmitView isSimulator={true} />
        </div>

        {/* Smartphone Home Indicator Bar */}
        <div className="py-2 bg-dark-950 flex justify-center border-t border-white/5 shrink-0">
          <div className="w-28 h-1 rounded-full bg-white/30"></div>
        </div>
      </div>
    </div>
  );

  // --- AUTHENTICATED ADMIN PANEL ---
  return (
    <div className="w-full max-w-[1750px] mx-auto py-4 sm:py-6 space-y-6">
      
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-fest-pes" />
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold font-sans text-white tracking-tight">
              ADMIN CONTROL ARENA
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Judge & Moderator Command Station • IEEE PES DIU SBC
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-mono w-full sm:w-auto justify-start sm:justify-end">
          {/* Live Connected Presence Counter */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-950 border border-white/10 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span><strong>{totalJoinedCount}</strong> Joined</span>
            </span>
            <button
              onClick={() => {
                if (window.confirm('Reset live presence connections? This clears inactive ghost devices; active contender phones will re-announce within seconds.')) {
                  clearAllPresence();
                }
              }}
              title="Reset active presence count & flush stale connections"
              className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-emerald-400 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
            <span className="text-white/20">|</span>
            <span className="text-fest-cyan">
              <strong>{participants.length}</strong> Submitted
            </span>
          </div>

          {/* Direct Quick Jump to Contenders JSON / Excel Uploader */}
          <button
            onClick={() => setAdminTab('roster')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded border font-bold transition-all ${
              adminTab === 'roster'
                ? 'bg-fest-cyan/20 border-fest-cyan text-fest-cyan shadow-[0_0_15px_rgba(0,229,255,0.3)]'
                : 'bg-dark-900 border-white/15 text-slate-300 hover:text-white hover:border-fest-cyan/40'
            }`}
            title="Upload Contenders JSON or Excel"
          >
            <FileCode className="w-3.5 h-3.5 text-fest-cyan" />
            <span className="hidden sm:inline">Upload Contenders (JSON/Excel)</span>
            <span className="sm:hidden">Upload JSON</span>
          </button>

          {/* Mobile phone toggle button for screens < xl */}
          <button
            onClick={() => setShowMobileSimulator(!showMobileSimulator)}
            className="xl:hidden flex items-center gap-1.5 px-3 py-2 rounded bg-fest-cyan/15 border border-fest-cyan/40 text-fest-cyan font-bold transition-all"
            title="Toggle Live Participant Screen"
          >
            <Smartphone className="w-3.5 h-3.5 animate-pulse" />
            <span>{showMobileSimulator ? 'Hide Phone' : 'Live Phone View'}</span>
          </button>

          <button
            onClick={() => setIsFirebaseOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded bg-fest-cyan/10 border border-fest-cyan/40 text-fest-cyan"
          >
            <Cloud className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cloud Sync Active</span>
            <span className="sm:hidden">Sync</span>
          </button>

          <button
            onClick={exportToCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded bg-dark-900 border border-white/10 text-slate-300 hover:text-white"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>

          <button
            onClick={() => {
              if (window.confirm('Reset all battle timers and participants? This cannot be undone.')) {
                resetAllData();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All</span>
          </button>

          <button
            onClick={logoutAdmin}
            className="flex items-center gap-1.5 px-3 py-2 rounded bg-dark-900 border border-white/10 text-slate-400 hover:text-white"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* MASTER ARENA BROADCAST SWITCHER */}
      <div className="p-4 rounded-xl bg-dark-900 border border-white/15 flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-xs">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-fest-cyan animate-pulse" />
          <span className="text-slate-300 uppercase tracking-wider font-bold">
            Auditorium Projector & Phones Live Broadcast Mode:
          </span>
          <span className="text-fest-cyan font-bold uppercase px-2.5 py-0.5 rounded bg-dark-950 border border-fest-cyan/40">
            {activeArena === 'battle' ? 'Prompt Battle Arena' : activeArena === 'poll' ? 'Live Poll Display' : 'Kahoot Quiz Screen'}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => switchArena('battle')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded transition-all ${
              activeArena === 'battle'
                ? 'bg-fest-cyan text-dark-950 font-bold shadow-[0_0_15px_rgba(0,229,255,0.4)]'
                : 'bg-dark-950 border border-white/10 text-slate-300 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Battle Screen</span>
          </button>

          <button
            onClick={() => switchArena('poll')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded transition-all ${
              activeArena === 'poll'
                ? 'bg-fest-pink text-white font-bold shadow-[0_0_15px_rgba(255,0,122,0.4)]'
                : 'bg-dark-950 border border-white/10 text-slate-300 hover:text-white'
            }`}
          >
            <Vote className="w-3.5 h-3.5" />
            <span>Poll Screen</span>
          </button>

          <button
            onClick={() => switchArena('quiz')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded transition-all ${
              activeArena === 'quiz'
                ? 'bg-fest-amber text-dark-950 font-bold shadow-[0_0_15px_rgba(255,183,0,0.4)]'
                : 'bg-dark-950 border border-white/10 text-slate-300 hover:text-white'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Kahoot Quiz Screen</span>
          </button>
        </div>
      </div>

      {/* MOBILE EXPANDED SIMULATOR (< xl) */}
      {showMobileSimulator && (
        <div className="xl:hidden p-4 rounded-2xl bg-dark-900 border border-fest-cyan/30 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/10 font-mono text-xs">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-fest-cyan animate-pulse" />
              <span className="font-bold text-white">Live Participant Screen Mirror</span>
            </div>
            <button
              onClick={() => setShowMobileSimulator(false)}
              className="px-2.5 py-1 rounded bg-dark-950 text-slate-400 hover:text-white text-[11px]"
            >
              Close
            </button>
          </div>
          <div className="flex justify-center">
            {renderPhoneSimulator()}
          </div>
        </div>
      )}

      {/* TWO-COLUMN COMMAND CENTER LAYOUT (Desktop xl: Side-by-side with Pinned Phone) */}
      <div className="flex flex-col xl:flex-row items-start gap-8">
        
        {/* LEFT COLUMN: Pinned Live Participant Phone Simulator (PINNED FOR ALL TIMES ON DESKTOP) */}
        <aside className="hidden xl:block w-[360px] 2xl:w-[380px] shrink-0 sticky top-24 self-start space-y-3">
          <div className="p-4 rounded-2xl bg-dark-900/90 border border-white/15 space-y-3 shadow-[0_0_40px_rgba(0,0,0,0.7)] backdrop-blur-md">
            
            {/* Simulator Header / Status */}
            <div className="flex items-center justify-between font-mono text-xs pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-fest-cyan animate-pulse" />
                <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                  Participant Screen
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-dark-950 text-fest-cyan border border-fest-cyan/30 font-bold uppercase">
                {activeArena} Live
              </span>
            </div>

            {/* Render Smartphone Frame */}
            {renderPhoneSimulator()}

            {/* Quick Testing Controls & Meta */}
            <div className="pt-2 border-t border-white/10 space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>Mirrored to All Phones</span>
                </span>
                <a
                  href="./#submit"
                  target="_blank"
                  rel="noreferrer"
                  className="text-fest-cyan hover:text-fest-pink transition-colors inline-flex items-center gap-1"
                  title="Open real phone view in new window"
                >
                  <span>Open #submit</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Stage switch test buttons right under phone */}
              <div className="grid grid-cols-3 gap-1.5 pt-1 text-[10px]">
                <button
                  type="button"
                  onClick={() => switchArena('battle')}
                  className={`py-1 rounded text-center transition-all ${
                    activeArena === 'battle' ? 'bg-fest-cyan text-dark-950 font-bold' : 'bg-dark-950 text-slate-400 hover:text-white'
                  }`}
                >
                  Battle
                </button>
                <button
                  type="button"
                  onClick={() => switchArena('poll')}
                  className={`py-1 rounded text-center transition-all ${
                    activeArena === 'poll' ? 'bg-fest-pink text-white font-bold' : 'bg-dark-950 text-slate-400 hover:text-white'
                  }`}
                >
                  Poll
                </button>
                <button
                  type="button"
                  onClick={() => switchArena('quiz')}
                  className={`py-1 rounded text-center transition-all ${
                    activeArena === 'quiz' ? 'bg-fest-amber text-dark-950 font-bold' : 'bg-dark-950 text-slate-400 hover:text-white'
                  }`}
                >
                  Kahoot
                </button>
              </div>
            </div>

          </div>
        </aside>

        {/* RIGHT COLUMN: Master Controls & Tabs */}
        <main className="flex-1 min-w-0 space-y-6 w-full">
          
          {/* ADMIN CONTROL SECTION TABS */}
          <div className="flex border-b border-white/10 font-mono text-xs sm:text-sm space-x-4 sm:space-x-6 overflow-x-auto pb-0.5">
            <button
              onClick={() => setAdminTab('battle')}
              className={`pb-3 flex items-center gap-2 font-bold transition-colors border-b-2 flex-shrink-0 ${
                adminTab === 'battle'
                  ? 'border-fest-cyan text-fest-cyan'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Flame className="w-4 h-4" />
              <span>Battle Timers & Scoring</span>
            </button>

            <button
              onClick={() => setAdminTab('roster')}
              className={`pb-3 flex items-center gap-2 font-bold transition-colors border-b-2 flex-shrink-0 ${
                adminTab === 'roster'
                  ? 'border-fest-pes text-fest-pes'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Contender Roster (JSON / Excel Upload)</span>
            </button>

            <button
              onClick={() => setAdminTab('judges')}
              className={`pb-3 flex items-center gap-2 font-bold transition-colors border-b-2 flex-shrink-0 ${
                adminTab === 'judges'
                  ? 'border-fest-amber text-fest-amber'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Scale className="w-4 h-4" />
              <span>4 Judges Adjudication ({judges.length}/4)</span>
            </button>

            <button
              onClick={() => setAdminTab('poll')}
              className={`pb-3 flex items-center gap-2 font-bold transition-colors border-b-2 flex-shrink-0 ${
                adminTab === 'poll'
                  ? 'border-fest-pink text-fest-pink'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Vote className="w-4 h-4" />
              <span>Live Poll & MCQ Manager</span>
            </button>

            <button
              onClick={() => setAdminTab('quiz')}
              className={`pb-3 flex items-center gap-2 font-bold transition-colors border-b-2 flex-shrink-0 ${
                adminTab === 'quiz'
                  ? 'border-fest-amber text-fest-amber'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>Kahoot Quiz Manager</span>
            </button>
          </div>

      {/* TAB 1: BATTLE TIMERS & SCORING */}
      {adminTab === 'battle' && (
        <div className="space-y-8">
          
          {/* Leaderboard Publishing State Switch */}
          <div className={`p-6 rounded-lg border transition-all ${
            published 
              ? 'bg-gradient-to-r from-emerald-950/40 via-dark-900 to-dark-950 border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.2)]'
              : 'bg-dark-900/60 border-white/15'
          }`}>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Trophy className={`w-5 h-5 ${published ? 'text-emerald-400' : 'text-fest-amber'}`} />
                  <h2 className="text-xl font-bold font-sans text-white uppercase tracking-tight">
                    Leaderboard Presentation State
                  </h2>
                </div>
                <p className="text-xs font-mono text-slate-400">
                  Auditorium Projector Display is currently showing:{' '}
                  <strong className={published ? 'text-emerald-400' : 'text-fest-cyan'}>
                    {published ? 'OFFICIAL LEADERBOARD (LIVE PUBLISHED)' : 'LIVE BATTLE ARENA & SUBMISSION FEED'}
                  </strong>
                </p>
              </div>

              <button
                onClick={() => togglePublishLeaderboard(!published)}
                className={`px-6 py-3.5 rounded-lg font-mono text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center gap-2 ${
                  published
                    ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-[0_0_20px_rgba(217,119,6,0.3)]'
                    : 'bg-gradient-to-r from-fest-pink to-fest-cyan hover:opacity-95 text-white shadow-[0_0_25px_rgba(255,0,122,0.4)]'
                }`}
              >
                <Trophy className="w-4 h-4 fill-current" />
                <span>{published ? 'Unpublish • Show Battle Clock' : 'Publish Leaderboard to Arena'}</span>
              </button>
            </div>
          </div>

          {/* Battle Timer Controls */}
          <div className="border border-white/10 rounded-lg p-6 bg-dark-900/50 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-fest-cyan" />
                <h3 className="font-sans font-bold text-white uppercase text-base">
                  Battle Timer Control Center
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Duration: {Math.floor(timer.duration / 60)} Mins
              </span>
            </div>

            <TimerDisplay size="medium" showControls={true} />

            <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Presets:</span>
                {[10, 15, 20, 30, 45, 60].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => handleSetPreset(mins)}
                    className={`px-3 py-1.5 rounded border transition-all ${
                      timer.duration === mins * 60
                        ? 'bg-fest-cyan/20 border-fest-cyan text-fest-cyan font-bold'
                        : 'bg-dark-950 border-white/10 text-slate-300 hover:text-white'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400">Custom (mins):</span>
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(e.target.value)}
                  className="w-16 px-2 py-1 rounded bg-dark-950 border border-white/10 text-white text-center"
                />
                <button
                  onClick={handleApplyCustomMinutes}
                  className="px-3 py-1 rounded bg-dark-850 hover:bg-dark-800 border border-white/10 text-slate-200"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>

          {/* Contender Evaluation & Scoring Rubric */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
              <div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-fest-cyan" />
                  <h2 className="text-xl font-bold font-sans text-white uppercase tracking-tight">
                    Contender Evaluation & Scoring Rubric
                  </h2>
                </div>
                <p className="text-xs font-mono text-slate-400 mt-0.5">
                  Input marks for Token Usage, Objective Fulfillment, Finish Status, Presentation Skill, and Novelty
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* View Mode Toggle */}
                <div className="flex items-center p-1 rounded-lg bg-dark-950 border border-white/10 text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => setEvaluationViewMode('table')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors ${
                      evaluationViewMode === 'table'
                        ? 'bg-fest-cyan/20 text-fest-cyan font-bold border border-fest-cyan/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Spreadsheet Table View (PC Optimized)"
                  >
                    <List className="w-3.5 h-3.5" />
                    <span>Table</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEvaluationViewMode('cards')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors ${
                      evaluationViewMode === 'cards'
                        ? 'bg-fest-pink/20 text-fest-pink font-bold border border-fest-pink/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Mobile Card Touch View (Mobile & Tablet Optimized)"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Cards</span>
                  </button>
                </div>

                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded bg-fest-cyan/15 hover:bg-fest-cyan/25 border border-fest-cyan/40 text-fest-cyan font-mono text-xs font-bold transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Contender</span>
                </button>
              </div>
            </div>

            {participants.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-white/10 rounded-lg font-mono text-slate-400">
                <p className="text-sm">No contenders submitted yet.</p>
                <p className="text-xs text-slate-400 mt-1">
                  Participants scanning the QR code will appear here automatically with their exact finish times.
                </p>
              </div>
            ) : evaluationViewMode === 'cards' ? (
              /* MOBILE & TOUCH FRIENDLY CARDS VIEW */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {participants.map((p, idx) => (
                  <div key={p.id} className="p-4 sm:p-5 rounded-xl bg-dark-900 border border-white/10 space-y-4 hover:border-fest-cyan/30 transition-all shadow-md">
                    {/* Card Header: Contender Station ID, Name & Total Score */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded bg-fest-cyan/20 border border-fest-cyan/40 text-fest-cyan font-mono text-xs font-bold shrink-0">
                            {p.participantId || `#${idx + 1}`}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-fest-amber/15 border border-fest-amber/40 text-fest-amber font-mono text-xs font-bold shrink-0 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-fest-amber" />
                            <span>{p.deskNumber || 'Desk Station'}</span>
                          </span>
                          <span className="font-sans font-bold text-base text-white truncate">{p.name}</span>
                        </div>
                        <span className="text-xs text-fest-pink font-mono block mt-0.5 truncate">{p.teamName}</span>
                        
                        {/* Time & Token Score Badges */}
                        <div className="flex items-center gap-2 text-[10px] font-mono mt-1">
                          <span className="text-emerald-400">
                            Time: <strong>{p.timeScore !== undefined ? p.timeScore : 15}/15</strong>
                          </span>
                          <span className="text-white/20">•</span>
                          <span className="text-fest-pink">
                            Antigravity: <strong>{p.tokensUsed || 0}% ({p.tokenScore !== undefined ? p.tokenScore : 15}/15 pts)</strong>
                          </span>
                        </div>

                        <div className="mt-1 flex items-center gap-2">
                          {p.tabSwitches > 0 ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold text-[10px]">
                              <AlertCircle className="w-3 h-3 text-rose-400" />
                              <span>{p.tabSwitches} tab switch{p.tabSwitches > 1 ? 'es' : ''}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px]">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Zero tab switches</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end shrink-0">
                        <span className="text-[10px] text-slate-400 font-mono uppercase">Total Score</span>
                        <div className="text-xl font-extrabold text-white font-mono flex items-baseline gap-0.5">
                          <span>{p.totalScore || 0}</span>
                          <span className="text-xs text-slate-400 font-normal">/100</span>
                        </div>
                      </div>
                    </div>

                    {/* Inputs Grid */}
                    <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-slate-400">Finish Time</span>
                          <span className="text-emerald-400">{p.timeScore !== undefined ? p.timeScore : 15}/15 pts</span>
                        </div>
                        <input
                          type="text"
                          value={p.finishTimeFormatted || ''}
                          onChange={(e) => updateParticipantMarks(p.id, { finishTimeFormatted: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded bg-dark-950 border border-white/15 text-white text-xs font-mono"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-slate-400">Antigravity Limit %</span>
                          <span className="text-fest-pink">{p.tokenScore !== undefined ? p.tokenScore : 15}/15 pts</span>
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={p.tokensUsed || 0}
                            onChange={(e) => updateParticipantMarks(p.id, { tokensUsed: Number(e.target.value) })}
                            className="w-full pl-2.5 pr-6 py-1.5 rounded bg-dark-950 border border-white/15 text-white text-xs font-mono focus:border-fest-pink"
                            placeholder="e.g. 15%"
                          />
                          <span className="absolute right-2 top-1.5 text-fest-pink font-bold text-xs">%</span>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-fest-cyan font-semibold">Objective</span>
                          <span className="text-fest-cyan">{p.objectiveScore || 0}/25</span>
                        </div>
                        <input
                          type="number"
                          min="0"
                          max="25"
                          value={p.objectiveScore || 0}
                          onChange={(e) => updateParticipantMarks(p.id, { objectiveScore: Number(e.target.value) })}
                          className="w-full px-2.5 py-1.5 rounded bg-dark-950 border border-fest-cyan/40 text-fest-cyan text-xs font-bold text-center"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Finish Status (0-15)</label>
                        <select
                          value={p.finishStatus || 'Partially Fulfilled'}
                          onChange={(e) => updateParticipantMarks(p.id, { finishStatus: e.target.value })}
                          className="w-full px-2 py-1.5 rounded bg-dark-950 border border-white/15 text-slate-200 text-xs"
                        >
                          <option value="Fully Completed">Fully Completed (15 pts)</option>
                          <option value="Substantially Completed">Substantially Completed (12 pts)</option>
                          <option value="Partially Fulfilled">Partially Fulfilled (8 pts)</option>
                          <option value="Minimal Fulfillment">Minimal Fulfillment (4 pts)</option>
                        </select>
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-slate-300">Presentation</span>
                          <span className="text-slate-300">{p.presentationScore || 0}/15</span>
                        </div>
                        <input
                          type="number"
                          min="0"
                          max="15"
                          value={p.presentationScore || 0}
                          onChange={(e) => updateParticipantMarks(p.id, { presentationScore: Number(e.target.value) })}
                          className="w-full px-2.5 py-1.5 rounded bg-dark-950 border border-white/15 text-white text-xs text-center"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-fest-pink font-semibold">Novelty</span>
                          <span className="text-fest-pink">{p.noveltyScore || 0}/15</span>
                        </div>
                        <input
                          type="number"
                          min="0"
                          max="15"
                          value={p.noveltyScore || 0}
                          onChange={(e) => updateParticipantMarks(p.id, { noveltyScore: Number(e.target.value) })}
                          className="w-full px-2.5 py-1.5 rounded bg-dark-950 border border-fest-pink/40 text-fest-pink text-xs font-bold text-center"
                        />
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] font-mono">
                      <div className="flex items-center gap-2">
                        {p.workUrl && (
                          <a
                            href={p.workUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-fest-cyan hover:underline inline-flex items-center gap-1"
                          >
                            <span>Inspect Prompt</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        <span className="text-slate-400 truncate max-w-[150px]" title={p.notes || 'No notes'}>
                          {p.notes ? `Note: ${p.notes}` : ''}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete ${p.name}?`)) {
                            removeParticipant(p.id);
                          }
                        }}
                        className="flex items-center gap-1 text-rose-400 hover:text-rose-300 px-2 py-1 rounded hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* SPREADSHEET TABLE VIEW (PC OPTIMIZED) */
              <div className="overflow-x-auto border border-white/10 rounded-lg">
                <table className="w-full min-w-[1020px] text-left font-mono text-xs">
                  <thead className="bg-dark-950 text-slate-400 uppercase tracking-wider text-[11px] border-b border-white/10">
                    <tr>
                      <th className="py-3 px-3">Station & Contender</th>
                      <th className="py-3 px-3">Finish Time (15)</th>
                      <th className="py-3 px-3">Antigravity Limit % (15)</th>
                      <th className="py-3 px-3">Objective (0-25)</th>
                      <th className="py-3 px-3">Finish Status (0-15)</th>
                      <th className="py-3 px-3">Presentation (0-15)</th>
                      <th className="py-3 px-3">Novelty (0-15)</th>
                      <th className="py-3 px-3 text-center">Tab Switches</th>
                      <th className="py-3 px-3 text-right">Total Score</th>
                      <th className="py-3 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 bg-dark-900/40">
                    {participants.map((p) => (
                      <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-3 font-sans">
                          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                            <span className="px-1.5 py-0.5 rounded bg-fest-cyan/20 border border-fest-cyan/40 text-fest-cyan font-mono text-[11px] font-bold">
                              {p.participantId || 'STATION'}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-fest-amber/15 border border-fest-amber/40 text-fest-amber font-mono text-[10px] font-bold flex items-center gap-1">
                              <MapPin className="w-2.5 h-2.5 text-fest-amber" />
                              <span>{p.deskNumber || 'Desk Station'}</span>
                            </span>
                            <span className="font-bold text-white text-sm">{p.name}</span>
                          </div>
                          <div className="text-xs text-fest-pink font-mono">{p.teamName}</div>
                          {p.workUrl && (
                            <a
                              href={p.workUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-fest-cyan hover:underline text-[10px] font-mono flex items-center gap-1 mt-0.5"
                            >
                              <span>Inspect Prompt Link</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                          {p.notes && (
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5 max-w-xs truncate" title={p.notes}>
                              Note: {p.notes}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          <input
                            type="text"
                            value={p.finishTimeFormatted || ''}
                            onChange={(e) => updateParticipantMarks(p.id, { finishTimeFormatted: e.target.value })}
                            className="w-24 px-2 py-1 rounded bg-dark-950 border border-white/10 text-white font-mono text-xs focus:border-fest-cyan"
                          />
                          <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
                            Time: <strong>{p.timeScore !== undefined ? p.timeScore : 15}/15</strong>
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={p.tokensUsed || 0}
                              onChange={(e) => updateParticipantMarks(p.id, { tokensUsed: Number(e.target.value) })}
                              className="w-16 px-2 py-1 rounded bg-dark-950 border border-white/10 text-white font-mono text-xs focus:border-fest-pink text-center"
                            />
                            <span className="text-[11px] text-fest-pink font-bold">%</span>
                          </div>
                          <div className="text-[10px] text-fest-pink font-mono mt-0.5">
                            Score: <strong>{p.tokenScore !== undefined ? p.tokenScore : 15}/15</strong>
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <input
                            type="number"
                            min="0"
                            max="25"
                            value={p.objectiveScore || 0}
                            onChange={(e) => updateParticipantMarks(p.id, { objectiveScore: Number(e.target.value) })}
                            className="w-16 px-2 py-1 rounded bg-dark-950 border border-fest-cyan/40 text-fest-cyan font-mono text-xs font-bold text-center"
                          />
                        </td>

                        <td className="py-3 px-3">
                          <select
                            value={p.finishStatus || 'Partially Fulfilled'}
                            onChange={(e) => updateParticipantMarks(p.id, { finishStatus: e.target.value })}
                            className="px-2 py-1 rounded bg-dark-950 border border-white/15 text-slate-200 font-mono text-xs focus:border-fest-pink"
                          >
                            <option value="Fully Completed">Fully Completed (15 pts)</option>
                            <option value="Substantially Completed">Substantially Completed (12 pts)</option>
                            <option value="Partially Fulfilled">Partially Fulfilled (8 pts)</option>
                            <option value="Minimal Fulfillment">Minimal Fulfillment (4 pts)</option>
                          </select>
                        </td>

                        <td className="py-3 px-3">
                          <input
                            type="number"
                            min="0"
                            max="15"
                            value={p.presentationScore || 0}
                            onChange={(e) => updateParticipantMarks(p.id, { presentationScore: Number(e.target.value) })}
                            className="w-16 px-2 py-1 rounded bg-dark-950 border border-white/10 text-white font-mono text-xs text-center"
                          />
                        </td>

                        <td className="py-3 px-3">
                          <input
                            type="number"
                            min="0"
                            max="15"
                            value={p.noveltyScore || 0}
                            onChange={(e) => updateParticipantMarks(p.id, { noveltyScore: Number(e.target.value) })}
                            className="w-16 px-2 py-1 rounded bg-dark-950 border border-fest-pink/40 text-fest-pink font-mono text-xs font-bold text-center"
                          />
                        </td>

                        <td className="py-3 px-3 text-center">
                          {p.tabSwitches > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold text-[11px]" title="Screen/tab switch detected">
                              <AlertCircle className="w-3 h-3 text-rose-400" />
                              <span>{p.tabSwitches}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[11px]">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>0</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-right">
                          <div className="text-base font-extrabold text-white font-mono">
                            {p.totalScore || 0}
                            <span className="text-[10px] text-slate-400 font-normal ml-1">/100</span>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete ${p.name}?`)) {
                                removeParticipant(p.id);
                              }
                            }}
                            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB: CONTENDER ROSTER & EXCEL IMPORT */}
      {adminTab === 'roster' && (
        <ContenderRosterManager 
          onSelectForEvaluation={(p) => {
            setAdminTab('battle');
          }}
        />
      )}

      {/* TAB: 4 JUDGES ADJUDICATION OVERSIGHT */}
      {adminTab === 'judges' && (
        <div className="space-y-6 font-mono text-xs">
          
          {/* Header */}
          <div className="p-6 rounded-2xl bg-dark-900 border border-white/15 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-xl bg-fest-amber/20 border border-fest-amber/40 text-fest-amber flex items-center justify-center shadow-[0_0_20px_rgba(255,183,0,0.3)]">
                <Scale className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-sans text-white">
                  4 Judges Adjudication Management
                </h3>
                <p className="text-slate-400 mt-0.5">
                  Adjudicators register using their Gmail and password. All 4 judges can grade all contenders.
                </p>
              </div>
            </div>

            <button
              onClick={() => switchView('judge')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-fest-amber text-dark-950 font-bold uppercase tracking-wider text-xs shadow-[0_0_15px_rgba(255,183,0,0.3)] hover:opacity-95 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open Judge Portal (/judge)</span>
            </button>
          </div>

          {/* 4 Judge Slots Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((slotNum) => {
              const judge = judges.find((j) => j.judgeNumber === slotNum);
              const evaluationsCount = judge
                ? participants.filter((p) => p.judgeMarks && p.judgeMarks[judge.id]).length
                : 0;

              return (
                <div 
                  key={slotNum}
                  className={`p-5 rounded-2xl border transition-all ${
                    judge
                      ? 'bg-dark-900 border-fest-amber/40 shadow-[0_0_20px_rgba(255,183,0,0.1)]'
                      : 'bg-dark-950/60 border-dashed border-white/15 text-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      judge ? 'bg-fest-amber text-dark-950' : 'bg-white/5 text-slate-400'
                    }`}>
                      Judge #{slotNum}
                    </span>
                    {judge && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Account Active"></span>
                    )}
                  </div>

                  {judge ? (
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-bold text-white text-sm font-sans truncate">{judge.name}</h4>
                        <p className="text-[11px] text-fest-cyan truncate mt-0.5">{judge.email}</p>
                      </div>

                      <div className="p-2.5 rounded-lg bg-dark-950 border border-white/10 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Graded:</span>
                        <span className="font-bold text-emerald-400">{evaluationsCount} Contenders</span>
                      </div>

                      <button
                        onClick={() => {
                          if (window.confirm(`Remove Judge #${slotNum} (${judge.name})? This will vacate this judge position.`)) {
                            deleteJudge(judge.id);
                          }
                        }}
                        className="w-full py-1.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 text-[10px] font-bold transition-colors"
                      >
                        Reset / Vacate Slot
                      </button>
                    </div>
                  ) : (
                    <div className="py-4 text-center space-y-1">
                      <span className="text-xs text-slate-400 font-bold block">Slot Available</span>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        Judge can register using Gmail at <code className="text-fest-amber">/judge</code>
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Contenders vs Judges Marking Matrix */}
          <div className="p-6 rounded-2xl bg-dark-900 border border-white/15 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="font-bold text-white uppercase tracking-wider text-xs flex items-center gap-2">
                <Scale className="w-4 h-4 text-fest-amber" />
                <span>Contender Multi-Judge Evaluation Matrix</span>
              </span>
              <span className="text-[11px] text-slate-400">
                {registeredContenders.length} Roster Contenders • {participants.length} Submissions
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Desk / ID</th>
                    <th className="py-2.5 px-3">Contender Name</th>
                    <th className="py-2.5 px-3 text-center">Judge 1</th>
                    <th className="py-2.5 px-3 text-center">Judge 2</th>
                    <th className="py-2.5 px-3 text-center">Judge 3</th>
                    <th className="py-2.5 px-3 text-center">Judge 4</th>
                    <th className="py-2.5 px-3 text-center">Average Score</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {(registeredContenders.length > 0 ? registeredContenders : participants).map((contender, idx) => {
                    const cleanId = (contender.participantId || contender.id || '').toUpperCase();
                    const participantData = participants.find((p) => (p.participantId?.toUpperCase() === cleanId || p.id === cleanId)) || contender;
                    const judgeMarks = participantData.judgeMarks || {};

                    // Get scores for judges 1 to 4
                    const j1 = judges.find(j => j.judgeNumber === 1);
                    const j2 = judges.find(j => j.judgeNumber === 2);
                    const j3 = judges.find(j => j.judgeNumber === 3);
                    const j4 = judges.find(j => j.judgeNumber === 4);

                    const s1 = j1 && judgeMarks[j1.id]?.totalScore;
                    const s2 = j2 && judgeMarks[j2.id]?.totalScore;
                    const s3 = j3 && judgeMarks[j3.id]?.totalScore;
                    const s4 = j4 && judgeMarks[j4.id]?.totalScore;

                    const gradedCount = [s1, s2, s3, s4].filter(s => s !== undefined).length;
                    const avgScore = participantData.totalScore || 0;

                    return (
                      <tr key={cleanId || idx} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 px-3">
                          <span className="font-bold text-fest-amber mr-2">{contender.deskNumber || 'Desk 01'}</span>
                          <span className="text-[10px] text-slate-400">{cleanId}</span>
                        </td>
                        <td className="py-3 px-3 font-bold text-white">
                          <div>{contender.name}</div>
                          <div className="text-[10px] text-fest-pink font-normal">{contender.teamName || 'Solo'}</div>
                        </td>
                        <td className="py-3 px-3 text-center font-mono">
                          {s1 !== undefined ? <span className="text-fest-cyan font-bold">{s1} pts</span> : <span className="text-slate-600">-</span>}
                        </td>
                        <td className="py-3 px-3 text-center font-mono">
                          {s2 !== undefined ? <span className="text-fest-pink font-bold">{s2} pts</span> : <span className="text-slate-600">-</span>}
                        </td>
                        <td className="py-3 px-3 text-center font-mono">
                          {s3 !== undefined ? <span className="text-fest-amber font-bold">{s3} pts</span> : <span className="text-slate-600">-</span>}
                        </td>
                        <td className="py-3 px-3 text-center font-mono">
                          {s4 !== undefined ? <span className="text-fest-pes font-bold">{s4} pts</span> : <span className="text-slate-600">-</span>}
                        </td>
                        <td className="py-3 px-3 text-center font-mono">
                          <span className="px-2 py-0.5 rounded bg-fest-pes/20 text-fest-pes font-extrabold text-xs">
                            {avgScore} / 100
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            gradedCount >= 4
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : gradedCount > 0
                              ? 'bg-fest-amber/20 text-fest-amber border border-fest-amber/30'
                              : 'bg-white/5 text-slate-500 border border-white/5'
                          }`}>
                            {gradedCount}/4 Judges Graded
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: LIVE POLL & MCQ MANAGER */}
      {adminTab === 'poll' && (
        <div className="space-y-8">
          
          {/* Active Poll Status & Publishing */}
          <div className="p-6 rounded-xl bg-dark-900 border border-white/15 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono text-fest-pink uppercase tracking-widest font-bold block mb-1">
                  Active Live Poll
                </span>
                <h3 className="text-xl font-bold font-sans text-white">
                  {poll?.question}
                </h3>
                <span className="text-xs font-mono text-slate-400 mt-1 block">
                  Mode: <strong className="text-fest-cyan uppercase">{poll?.type}</strong> • Total Votes: <strong className="text-white">{Object.keys(poll?.votes || {}).length}</strong>
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPollStatus(poll?.status === 'active' ? 'closed' : 'active')}
                  className={`px-4 py-2 rounded font-mono text-xs font-bold uppercase tracking-wider ${
                    poll?.status === 'active'
                      ? 'bg-amber-600 hover:bg-amber-500 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {poll?.status === 'active' ? 'Conclude Voting' : 'Re-open Voting'}
                </button>

                <button
                  onClick={() => publishPollResults(!poll?.published)}
                  className={`px-4 py-2 rounded font-mono text-xs font-bold uppercase tracking-wider ${
                    poll?.published
                      ? 'bg-fest-cyan text-dark-950'
                      : 'bg-fest-pink text-white shadow-[0_0_15px_rgba(255,0,122,0.3)]'
                  }`}
                >
                  {poll?.published ? 'Hide Results from Arena' : 'Publish Results to Arena'}
                </button>

                <button
                  onClick={() => setEditingPollModal({
                    question: poll?.question || '',
                    type: poll?.type || 'mcq',
                    options: (poll?.options || []).map(o => ({ ...o }))
                  })}
                  className="px-3.5 py-2 rounded bg-dark-950 border border-white/10 text-slate-200 hover:text-white flex items-center gap-1.5 font-mono text-xs"
                  title="Edit question text and options"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Poll</span>
                </button>

                <button
                  onClick={() => {
                    if (window.confirm('Delete and reset active poll? Contenders will see a standby screen.')) {
                      deletePoll();
                    }
                  }}
                  className="px-3 py-2 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20"
                  title="Delete active poll"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <button
                  onClick={resetPoll}
                  className="px-3 py-2 rounded bg-dark-950 border border-white/10 text-slate-400 hover:text-white"
                  title="Reset to default poll"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {poll?.options?.map((opt, idx) => (
                <div key={opt.id} className="p-3 rounded bg-dark-950 border border-white/10 flex items-center justify-between font-mono text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-fest-cyan">Option {String.fromCharCode(65 + idx)}:</span>
                    <span className="text-white">{opt.text}</span>
                    {opt.isCorrect && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px]">CORRECT</span>
                    )}
                  </div>
                  <span className="font-bold text-slate-300">
                    {opt.votes || 0} votes
                  </span>
                </div>
              ))}
            </div>

            {/* Display Mode Selection (for MCQ) */}
            {poll?.type === 'mcq' && (
              <div className="p-3 rounded-lg bg-dark-950 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-mono text-xs">
                <span className="text-slate-300 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-fest-cyan" />
                  <span>Auditorium Projector View:</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPollDisplayMode('percentage')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all ${
                      (poll?.displayMode || 'percentage') === 'percentage'
                        ? 'bg-fest-cyan text-dark-950 font-bold shadow-[0_0_12px_rgba(0,229,255,0.4)]'
                        : 'bg-dark-900 border border-white/10 text-slate-300 hover:text-white'
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>Option Percentages View</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPollDisplayMode('leaderboard')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all ${
                      poll?.displayMode === 'leaderboard'
                        ? 'bg-fest-amber text-dark-950 font-bold shadow-[0_0_12px_rgba(255,183,0,0.4)]'
                        : 'bg-dark-900 border border-white/10 text-slate-300 hover:text-white'
                    }`}
                  >
                    <Trophy className="w-3.5 h-3.5" />
                    <span>MCQ Best Performers (Speed & Accuracy)</span>
                  </button>
                </div>
              </div>
            )}

            {/* Live Respondents List */}
            {Object.keys(poll?.votes || {}).length > 0 && (
              <div className="pt-3 border-t border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-fest-pink" />
                    <span>Live Contender Votes ({Object.keys(poll?.votes || {}).length} Submitted / {totalJoinedCount} Joined)</span>
                  </span>
                </div>
                <div className="overflow-x-auto max-h-56 scrollbar-thin border border-white/10 rounded-lg">
                  <table className="w-full text-left font-mono text-xs">
                    <thead className="bg-dark-950 text-slate-400 text-[11px] uppercase tracking-wider sticky top-0">
                      <tr>
                        <th className="py-2 px-3">Contender</th>
                        <th className="py-2 px-3">Team</th>
                        <th className="py-2 px-3">Selected Option</th>
                        {poll?.type === 'mcq' && <th className="py-2 px-3 text-center">Correctness</th>}
                        <th className="py-2 px-3 text-center">Speed</th>
                        {poll?.type === 'mcq' && <th className="py-2 px-3 text-right">Score</th>}
                        <th className="py-2 px-3 text-center">Tab Switches</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 bg-dark-950/60">
                      {Object.values(poll?.votes || {}).map((vote) => {
                        const opt = poll?.options?.find(o => o.id === vote.optionId);
                        return (
                          <tr key={vote.participantId} className="hover:bg-white/[0.02]">
                            <td className="py-2 px-3 font-sans font-bold text-white">{vote.name}</td>
                            <td className="py-2 px-3 text-fest-pink">{vote.teamName || 'Solo'}</td>
                            <td className="py-2 px-3 text-slate-300">{opt?.text || 'Option'}</td>
                            {poll?.type === 'mcq' && (
                              <td className="py-2 px-3 text-center">
                                {vote.isCorrect ? (
                                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">CORRECT</span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold text-[10px]">WRONG</span>
                                )}
                              </td>
                            )}
                            <td className="py-2 px-3 text-center text-fest-cyan font-bold">{vote.timeTakenSec ? `${vote.timeTakenSec}s` : '—'}</td>
                            {poll?.type === 'mcq' && (
                              <td className="py-2 px-3 text-right text-fest-amber font-bold">{vote.score || 0} pts</td>
                            )}
                            <td className="py-2 px-3 text-center">
                              {vote.tabSwitches > 0 ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-bold">
                                  <AlertCircle className="w-3 h-3 text-rose-400" />
                                  <span>{vote.tabSwitches}</span>
                                </span>
                              ) : (
                                <span className="text-emerald-400 text-[10px]">0</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Create New Poll Form */}
          <form onSubmit={handleCreatePoll} className="p-6 rounded-xl bg-dark-900/60 border border-white/15 space-y-4">
            <h4 className="font-sans font-bold text-white text-base flex items-center gap-2">
              <Vote className="w-4 h-4 text-fest-pink" />
              <span>Create New Poll / MCQ Question</span>
            </h4>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">Question Prompt *</label>
              <input
                type="text"
                required
                value={newPollQuestion}
                onChange={(e) => setNewPollQuestion(e.target.value)}
                placeholder="e.g. Which prompt framework provides the best zero-shot consistency?"
                className="w-full px-3 py-2 rounded bg-dark-950 border border-white/15 text-white font-sans text-sm focus:border-fest-pink"
              />
            </div>

            <div className="flex items-center gap-6 text-xs font-mono">
              <span className="text-slate-400">Poll Mode:</span>
              <label className="flex items-center gap-2 cursor-pointer text-white">
                <input
                  type="radio"
                  name="pollType"
                  value="mcq"
                  checked={newPollType === 'mcq'}
                  onChange={() => setNewPollType('mcq')}
                  className="accent-fest-pink"
                />
                <span>MCQ (Has 1 Correct Answer)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-white">
                <input
                  type="radio"
                  name="pollType"
                  value="voting"
                  checked={newPollType === 'voting'}
                  onChange={() => setNewPollType('voting')}
                  className="accent-fest-cyan"
                />
                <span>Audience Opinion (Pure Voting)</span>
              </label>
            </div>

            <div className="space-y-2 pt-2">
              <label className="block text-xs font-mono text-slate-300">
                Options {newPollType === 'mcq' && '(Select radio to mark correct answer):'}
              </label>
              {newPollOptions.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  {newPollType === 'mcq' && (
                    <input
                      type="radio"
                      name="correctOption"
                      checked={opt.isCorrect}
                      onChange={() => {
                        const updated = newPollOptions.map((o, i) => ({ ...o, isCorrect: i === idx }));
                        setNewPollOptions(updated);
                      }}
                      className="accent-emerald-400 w-4 h-4 cursor-pointer"
                      title="Mark as correct answer"
                    />
                  )}
                  <span className="font-mono text-xs text-slate-400 w-6">
                    {String.fromCharCode(65 + idx)}:
                  </span>
                  <input
                    type="text"
                    required={idx < 2}
                    value={opt.text}
                    onChange={(e) => {
                      const updated = [...newPollOptions];
                      updated[idx].text = e.target.value;
                      setNewPollOptions(updated);
                    }}
                    placeholder={`Option ${String.fromCharCode(65 + idx)} text...`}
                    className="flex-1 px-3 py-1.5 rounded bg-dark-950 border border-white/10 text-white font-mono text-xs focus:border-fest-pink"
                  />
                </div>
              ))}
            </div>

            <button
              type="submit"
              className="py-2.5 px-6 rounded bg-gradient-to-r from-fest-pink to-fest-cyan text-white font-mono text-xs font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(255,0,122,0.3)]"
            >
              Launch Poll to Arena & Phones
            </button>
          </form>

        </div>
      )}

      {/* TAB 3: KAHOOT QUIZ MANAGER */}
      {adminTab === 'quiz' && (
        <div className="space-y-8">
          
          <div className="p-6 rounded-xl bg-dark-900 border border-white/15 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono text-fest-amber uppercase tracking-widest font-bold block mb-1">
                  Kahoot Live Question Controller
                </span>
                <h3 className="text-xl font-bold font-sans text-white">
                  Question {(quiz?.currentQuestionIndex || 0) + 1} of {quiz?.questions?.length || 0}
                </h3>
                <p className="text-xs font-mono text-slate-300 mt-1 max-w-xl">
                  {quiz?.questions?.[quiz?.currentQuestionIndex || 0]?.question}
                </p>
                <div className="text-xs font-mono text-slate-400 mt-2 flex items-center gap-3">
                  <span>Status: <strong className="text-fest-cyan uppercase">{quiz?.status}</strong></span>
                  <span>•</span>
                  <span>Responses: <strong className="text-white">{Object.keys(quiz?.submissions || {}).length}</strong> / <strong className="text-emerald-400">{totalJoinedCount}</strong> Joined</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => launchQuizQuestion(quiz?.currentQuestionIndex || 0)}
                  className="px-4 py-2.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Launch Question to Phones</span>
                </button>

                <button
                  onClick={endQuizQuestion}
                  className="px-4 py-2.5 rounded bg-amber-600 hover:bg-amber-500 text-white font-mono text-xs font-bold uppercase tracking-wider"
                >
                  End Question
                </button>

                <button
                  onClick={() => {
                    const nextIdx = Math.min((quiz?.questions?.length || 1) - 1, (quiz?.currentQuestionIndex || 0) + 1);
                    launchQuizQuestion(nextIdx);
                  }}
                  className="px-4 py-2.5 rounded bg-fest-cyan text-dark-950 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                >
                  <span>Next Question</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => publishQuizLeaderboard(!quiz?.published)}
                  className={`px-4 py-2.5 rounded font-mono text-xs font-bold uppercase tracking-wider ${
                    quiz?.published
                      ? 'bg-amber-600 text-white'
                      : 'bg-fest-amber text-dark-950 shadow-[0_0_20px_rgba(255,183,0,0.4)]'
                  }`}
                >
                  {quiz?.published ? 'Hide Podium' : 'Publish Grand Quiz Podium'}
                </button>

                <button
                  onClick={resetQuiz}
                  className="px-3 py-2.5 rounded bg-dark-950 border border-white/10 text-slate-400 hover:text-white"
                  title="Reset Quiz"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Live Quiz Responses Roster */}
            {Object.keys(quiz?.submissions || {}).length > 0 && (
              <div className="pt-3 border-t border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-fest-amber" />
                    <span>Live Contender Submissions ({Object.keys(quiz?.submissions || {}).length} Answered / {totalJoinedCount} Joined)</span>
                  </span>
                </div>
                <div className="overflow-x-auto max-h-56 scrollbar-thin border border-white/10 rounded-lg">
                  <table className="w-full text-left font-mono text-xs">
                    <thead className="bg-dark-950 text-slate-400 text-[11px] uppercase tracking-wider sticky top-0">
                      <tr>
                        <th className="py-2 px-3">Contender</th>
                        <th className="py-2 px-3">Team</th>
                        <th className="py-2 px-3 text-center">Selected Option</th>
                        <th className="py-2 px-3 text-center">Status</th>
                        <th className="py-2 px-3 text-center">Speed</th>
                        <th className="py-2 px-3 text-right">Points</th>
                        <th className="py-2 px-3 text-center">Tab Switches</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 bg-dark-950/60">
                      {Object.values(quiz?.submissions || {}).map((sub) => {
                        const optLabels = ['A', 'B', 'C', 'D'];
                        const optText = quiz?.questions?.[quiz?.currentQuestionIndex || 0]?.options?.[sub.selectedIndex];
                        return (
                          <tr key={sub.participantId} className="hover:bg-white/[0.02]">
                            <td className="py-2 px-3 font-sans font-bold text-white">{sub.name}</td>
                            <td className="py-2 px-3 text-fest-amber">{sub.teamName || 'Solo'}</td>
                            <td className="py-2 px-3 text-center font-bold text-slate-200">
                              Option {optLabels[sub.selectedIndex] || '—'} {optText ? `(${optText})` : ''}
                            </td>
                            <td className="py-2 px-3 text-center">
                              {sub.isCorrect ? (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">CORRECT</span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold text-[10px]">WRONG</span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-center text-fest-cyan font-bold">{sub.timeTakenSec ? `${sub.timeTakenSec}s` : '—'}</td>
                            <td className="py-2 px-3 text-right text-fest-amber font-bold">+{sub.score || 0}</td>
                            <td className="py-2 px-3 text-center">
                              {sub.tabSwitches > 0 ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-bold">
                                  <AlertCircle className="w-3 h-3 text-rose-400" />
                                  <span>{sub.tabSwitches}</span>
                                </span>
                              ) : (
                                <span className="text-emerald-400 text-[10px]">0</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* ALL QUIZ QUESTIONS BANK (EDITABLE & DELETABLE) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10 font-mono text-xs">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-fest-amber" />
                <h3 className="font-sans font-bold text-base text-white uppercase tracking-tight">
                  Kahoot Question Bank ({quiz?.questions?.length || 0} Questions)
                </h3>
              </div>
              <span className="text-slate-400">
                Active Question: #{(quiz?.currentQuestionIndex || 0) + 1}
              </span>
            </div>

            <div className="space-y-3">
              {(quiz?.questions || []).map((q, idx) => (
                <div 
                  key={q.id || idx}
                  className={`p-4 rounded-xl border transition-all ${
                    idx === (quiz?.currentQuestionIndex || 0)
                      ? 'bg-dark-900 border-fest-amber/50 shadow-[0_0_20px_rgba(255,183,0,0.15)]'
                      : 'bg-dark-950/70 border-white/10'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2.5 border-b border-white/10">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded font-mono font-bold text-xs ${
                        idx === (quiz?.currentQuestionIndex || 0)
                          ? 'bg-fest-amber text-dark-950'
                          : 'bg-dark-900 border border-white/10 text-slate-300'
                      }`}>
                        Q{idx + 1}
                      </span>
                      <span className="font-sans font-bold text-white text-sm">
                        {q.question}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-dark-900 text-fest-cyan text-[10px] font-mono border border-fest-cyan/30">
                        {q.timeLimit || 20}s
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 font-mono text-xs">
                      <button
                        onClick={() => launchQuizQuestion(idx)}
                        className="px-3 py-1 rounded bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-600 hover:text-white font-bold transition-all text-[11px] flex items-center gap-1"
                        title="Broadcast this question to phones"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Launch</span>
                      </button>

                      <button
                        onClick={() => setEditingQuizQ({ ...q, index: idx, options: [...(q.options || [])] })}
                        className="p-1.5 rounded bg-dark-900 border border-white/10 text-slate-300 hover:text-white"
                        title="Edit question text, options, and answer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          if (window.confirm(`Delete question Q${idx + 1}: "${q.question}"?`)) {
                            deleteQuizQuestion(q.id);
                          }
                        }}
                        className="p-1.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/30"
                        title="Delete question"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Options List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2.5 font-mono text-xs">
                    {(q.options || []).map((opt, optIdx) => {
                      const isCorrect = q.correctIndex === optIdx;
                      return (
                        <div 
                          key={optIdx}
                          className={`p-2 rounded flex items-center justify-between border ${
                            isCorrect 
                              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300' 
                              : 'bg-dark-900/60 border-white/5 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-fest-cyan">
                              {String.fromCharCode(65 + optIdx)}:
                            </span>
                            <span>{opt}</span>
                          </div>
                          {isCorrect && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/30 text-emerald-300">
                              CORRECT
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleAddQuestion} className="p-6 rounded-xl bg-dark-900/60 border border-white/15 space-y-4">
            <h4 className="font-sans font-bold text-white text-base flex items-center gap-2">
              <Plus className="w-4 h-4 text-fest-amber" />
              <span>Add Custom Kahoot Question</span>
            </h4>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">Question Prompt *</label>
              <input
                type="text"
                required
                value={newQText}
                onChange={(e) => setNewQText(e.target.value)}
                placeholder="e.g. Which prompt injection defense enforces output syntax verification?"
                className="w-full px-3 py-2 rounded bg-dark-950 border border-white/15 text-white font-sans text-sm focus:border-fest-amber"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {['A (Red ▲)', 'B (Blue ◆)', 'C (Yellow ●)', 'D (Green ■)'].map((label, idx) => (
                <div key={idx}>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1 flex items-center justify-between">
                    <span>Option {label}</span>
                    <span className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="correctIdx"
                        checked={newQCorrect === idx}
                        onChange={() => setNewQCorrect(idx)}
                        className="accent-emerald-400"
                      />
                      <span className={newQCorrect === idx ? 'text-emerald-400 font-bold' : ''}>Correct</span>
                    </span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newQOpts[idx]}
                    onChange={(e) => {
                      const updated = [...newQOpts];
                      updated[idx] = e.target.value;
                      setNewQOpts(updated);
                    }}
                    placeholder={`Answer text for ${label}...`}
                    className="w-full px-3 py-1.5 rounded bg-dark-950 border border-white/10 text-white font-mono text-xs focus:border-fest-amber"
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center gap-4 text-xs font-mono pt-2">
              <span className="text-slate-300">Time Limit:</span>
              {[15, 20, 30, 45].map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setNewQTime(s)}
                  className={`px-3 py-1 rounded border ${
                    newQTime === s ? 'bg-fest-amber text-dark-950 font-bold border-fest-amber' : 'bg-dark-950 text-slate-300 border-white/10'
                  }`}
                >
                  {s}s
                </button>
              ))}
            </div>

            <button
              type="submit"
              className="py-2.5 px-6 rounded bg-fest-amber text-dark-950 font-mono text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(255,183,0,0.3)]"
            >
              Add Question to Quiz
            </button>
          </form>

        </div>
      )}

        </main>
      </div>

      {/* Manual Contender Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-dark-900 border border-white/15 rounded-xl p-6 space-y-4">
            <h3 className="font-sans font-bold text-white text-base">
              Add Contender Manually
            </h3>
            
            <form onSubmit={handleAddManual} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Participant Name *</label>
                <input
                  type="text"
                  required
                  value={newManualName}
                  onChange={(e) => setNewManualName(e.target.value)}
                  placeholder="e.g. Shakib Ahmed"
                  className="w-full px-3 py-2 rounded bg-dark-950 border border-white/10 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Team Name (Optional)</label>
                <input
                  type="text"
                  value={newManualTeam}
                  onChange={(e) => setNewManualTeam(e.target.value)}
                  placeholder="e.g. DIU Sparks"
                  className="w-full px-3 py-2 rounded bg-dark-950 border border-white/10 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Finish Time Recorded</label>
                <input
                  type="text"
                  value={newManualTime}
                  onChange={(e) => setNewManualTime(e.target.value)}
                  placeholder="e.g. 11m 45s"
                  className="w-full px-3 py-2 rounded bg-dark-950 border border-white/10 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-fest-cyan text-dark-950 font-bold"
                >
                  Add Contender
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT QUIZ QUESTION MODAL */}
      {editingQuizQ && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-xl bg-dark-900 border border-white/20 rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto scrollbar-thin font-mono text-xs shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="font-sans font-bold text-white text-base">
                Edit Kahoot Question #{editingQuizQ.index + 1}
              </h3>
              <button
                onClick={() => setEditingQuizQ(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateQuizQuestion(editingQuizQ.id, {
                  question: editingQuizQ.question,
                  options: editingQuizQ.options,
                  correctIndex: editingQuizQ.correctIndex,
                  timeLimit: editingQuizQ.timeLimit,
                });
                setEditingQuizQ(null);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-slate-300 font-bold mb-1">Question Prompt *</label>
                <input
                  type="text"
                  required
                  value={editingQuizQ.question}
                  onChange={(e) => setEditingQuizQ({ ...editingQuizQ, question: e.target.value })}
                  className="w-full px-3 py-2 rounded bg-dark-950 border border-white/15 text-white font-sans text-sm focus:border-fest-amber"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-slate-300 font-bold">Answer Options (Select radio for correct answer):</label>
                {(editingQuizQ.options || []).map((opt, oIdx) => (
                  <div key={oIdx} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="editCorrectIdx"
                      checked={editingQuizQ.correctIndex === oIdx}
                      onChange={() => setEditingQuizQ({ ...editingQuizQ, correctIndex: oIdx })}
                      className="accent-emerald-400 w-4 h-4 cursor-pointer shrink-0"
                    />
                    <span className="text-slate-400 w-6 shrink-0">{String.fromCharCode(65 + oIdx)}:</span>
                    <input
                      type="text"
                      required
                      value={opt}
                      onChange={(e) => {
                        const updated = [...editingQuizQ.options];
                        updated[oIdx] = e.target.value;
                        setEditingQuizQ({ ...editingQuizQ, options: updated });
                      }}
                      className="flex-1 px-3 py-1.5 rounded bg-dark-950 border border-white/10 text-white"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Time Limit (Seconds)</label>
                <input
                  type="number"
                  min="5"
                  max="120"
                  value={editingQuizQ.timeLimit || 20}
                  onChange={(e) => setEditingQuizQ({ ...editingQuizQ, timeLimit: Number(e.target.value) })}
                  className="w-24 px-3 py-1.5 rounded bg-dark-950 border border-white/15 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingQuizQ(null)}
                  className="px-4 py-2 rounded text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded bg-fest-amber text-dark-950 font-bold uppercase tracking-wider"
                >
                  Save Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT POLL MODAL */}
      {editingPollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-xl bg-dark-900 border border-white/20 rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto scrollbar-thin font-mono text-xs shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="font-sans font-bold text-white text-base">
                Edit Active Live Poll
              </h3>
              <button
                onClick={() => setEditingPollModal(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updatePoll({
                  question: editingPollModal.question,
                  type: editingPollModal.type,
                  options: editingPollModal.options,
                });
                setEditingPollModal(null);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-slate-300 font-bold mb-1">Question Prompt *</label>
                <input
                  type="text"
                  required
                  value={editingPollModal.question}
                  onChange={(e) => setEditingPollModal({ ...editingPollModal, question: e.target.value })}
                  className="w-full px-3 py-2 rounded bg-dark-950 border border-white/15 text-white font-sans text-sm focus:border-fest-pink"
                />
              </div>

              <div className="flex items-center gap-6">
                <span className="text-slate-400">Poll Type:</span>
                <label className="flex items-center gap-2 cursor-pointer text-white">
                  <input
                    type="radio"
                    name="editPollType"
                    value="mcq"
                    checked={editingPollModal.type === 'mcq'}
                    onChange={() => setEditingPollModal({ ...editingPollModal, type: 'mcq' })}
                    className="accent-fest-pink"
                  />
                  <span>MCQ (Has 1 Correct Answer)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-white">
                  <input
                    type="radio"
                    name="editPollType"
                    value="voting"
                    checked={editingPollModal.type === 'voting'}
                    onChange={() => setEditingPollModal({ ...editingPollModal, type: 'voting' })}
                    className="accent-fest-cyan"
                  />
                  <span>Opinion Voting</span>
                </label>
              </div>

              <div className="space-y-2">
                <label className="block text-slate-300 font-bold">Options:</label>
                {(editingPollModal.options || []).map((opt, oIdx) => (
                  <div key={oIdx} className="flex items-center gap-2">
                    {editingPollModal.type === 'mcq' && (
                      <input
                        type="radio"
                        name="editPollCorrectOpt"
                        checked={Boolean(opt.isCorrect)}
                        onChange={() => {
                          const updated = editingPollModal.options.map((o, i) => ({ ...o, isCorrect: i === oIdx }));
                          setEditingPollModal({ ...editingPollModal, options: updated });
                        }}
                        className="accent-emerald-400 w-4 h-4 cursor-pointer shrink-0"
                        title="Mark as correct answer"
                      />
                    )}
                    <span className="text-slate-400 w-6 shrink-0">{String.fromCharCode(65 + oIdx)}:</span>
                    <input
                      type="text"
                      required
                      value={opt.text}
                      onChange={(e) => {
                        const updated = [...editingPollModal.options];
                        updated[oIdx] = { ...updated[oIdx], text: e.target.value };
                        setEditingPollModal({ ...editingPollModal, options: updated });
                      }}
                      className="flex-1 px-3 py-1.5 rounded bg-dark-950 border border-white/10 text-white"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (editingPollModal.options.length <= 2) {
                          alert('Poll must have at least 2 options.');
                          return;
                        }
                        const updated = editingPollModal.options.filter((_, i) => i !== oIdx);
                        setEditingPollModal({ ...editingPollModal, options: updated });
                      }}
                      className="p-1 rounded text-slate-400 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingPollModal(null)}
                  className="px-4 py-2 rounded text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded bg-fest-pink text-white font-bold uppercase tracking-wider"
                >
                  Save Poll
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Firebase Sync Settings Modal */}
      <FirebaseModal 
        isOpen={isFirebaseOpen} 
        onClose={() => setIsFirebaseOpen(false)} 
      />

    </div>
  );
}
