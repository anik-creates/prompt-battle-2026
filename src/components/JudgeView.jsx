import React, { useState, useMemo } from 'react';
import { useBattle } from '../context/BattleContext';
import { 
  Scale, 
  UserCheck, 
  Lock, 
  Key, 
  Mail, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  ExternalLink, 
  Search, 
  Award, 
  LogOut, 
  Sparkles, 
  Clock, 
  Zap, 
  MapPin, 
  Check, 
  RotateCcw,
  UserPlus,
  ShieldCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { calculateTokenScore, calculateTimeScore } from '../lib/scoringCalculator';

export default function JudgeView() {
  const { 
    judges = [], 
    currentJudge, 
    registerJudge, 
    authenticateJudge, 
    logoutJudge, 
    submitJudgeEvaluation, 
    registeredContenders = [], 
    participants = [],
    switchView
  } = useBattle();

  // Auth Mode: 'login' | 'signup'
  const [authMode, setAuthMode] = useState('login');
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'pending' | 'evaluated'

  // Evaluation Form State for actively expanded contender
  const [expandedContenderId, setExpandedContenderId] = useState(null);
  const [scores, setScores] = useState({
    objectiveScore: 25,
    noveltyScore: 15,
    presentationScore: 15,
    tokenScore: 12,
    timeScore: 8,
    notes: '',
  });
  const [saveSuccessId, setSaveSuccessId] = useState(null);

  // Combine registered contenders and submitted participants into unified contender list
  const unifiedContenders = useMemo(() => {
    const map = new Map();

    // 1. Registered Contenders
    (registeredContenders || []).forEach((rc) => {
      const id = (rc.participantId || rc.studentId || '').toUpperCase();
      if (!id) return;
      map.set(id, {
        ...rc,
        id,
        participantId: id,
        studentId: rc.studentId || id,
        name: rc.name,
        email: rc.email || rc.studentMail || '',
        studentMail: rc.studentMail || '',
        personalMail: rc.personalMail || '',
        semester: rc.semester || '',
        phone: rc.phone || '',
        couponCode: rc.couponCode || rc.passcode || '',
        teamName: rc.teamName || 'Solo Contender',
        deskNumber: rc.deskNumber || 'Desk 01',
        submittedUrl: '',
        tokensUsed: 0,
        dailyLimitPercentageUsed: 0,
        finishTimeFormatted: 'Not submitted',
        finishSeconds: 0,
        hasSubmitted: false,
        judgeMarks: {},
        totalScore: 0,
      });
    });

    // 2. Overlay live submitted participants
    (participants || []).forEach((p) => {
      const id = (p.participantId || p.id || '').toUpperCase();
      if (!id) return;
      const prev = map.get(id) || {};
      map.set(id, {
        ...prev,
        ...p,
        id,
        participantId: id,
        name: p.name || prev.name || `Contender ${id}`,
        teamName: p.teamName || prev.teamName || 'Solo Contender',
        deskNumber: p.deskNumber || prev.deskNumber || 'Desk 01',
        email: p.email || prev.email || '',
        submittedUrl: p.submittedUrl || p.promptUrl || '',
        tokensUsed: Number(p.tokensUsed) || 0,
        dailyLimitPercentageUsed: Number(p.dailyLimitPercentageUsed ?? p.tokensUsed) || 0,
        finishTimeFormatted: p.finishTimeFormatted || '12m 00s',
        finishSeconds: Number(p.finishSeconds) || 720,
        hasSubmitted: Boolean(p.submittedUrl || p.hasSubmitted || p.finishSeconds),
        judgeMarks: p.judgeMarks || prev.judgeMarks || {},
        totalScore: Number(p.totalScore) || 0,
      });
    });

    return Array.from(map.values());
  }, [registeredContenders, participants]);

  // Filtered list
  const filteredContenders = useMemo(() => {
    return unifiedContenders.filter((c) => {
      const term = searchTerm.toLowerCase().trim();
      const matchSearch = 
        !term || 
        c.name?.toLowerCase().includes(term) ||
        c.participantId?.toLowerCase().includes(term) ||
        c.deskNumber?.toLowerCase().includes(term) ||
        c.email?.toLowerCase().includes(term);

      if (!matchSearch) return false;

      const myEval = currentJudge && c.judgeMarks && c.judgeMarks[currentJudge.id];
      if (filterMode === 'pending') return !myEval;
      if (filterMode === 'evaluated') return !!myEval;
      return true;
    });
  }, [unifiedContenders, searchTerm, filterMode, currentJudge]);

  // KPI calculations for current judge
  const evaluatedCount = useMemo(() => {
    if (!currentJudge) return 0;
    return unifiedContenders.filter((c) => c.judgeMarks && c.judgeMarks[currentJudge.id]).length;
  }, [unifiedContenders, currentJudge]);

  const pendingCount = unifiedContenders.length - evaluatedCount;

  // Handle Judge Signup
  const handleSignUp = (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    const res = registerJudge({
      name: nameInput.trim(),
      email: emailInput.trim(),
      password: passwordInput.trim(),
    });

    if (res.success) {
      setAuthSuccess(`Welcome, Judge #${res.judge.judgeNumber}! Account created successfully.`);
    } else {
      setAuthError(res.error || 'Failed to register judge.');
    }
  };

  // Handle Judge Login
  const handleLogin = (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    const res = authenticateJudge(emailInput.trim(), passwordInput.trim());

    if (res.success) {
      setAuthSuccess(`Welcome back, Judge #${res.judge.judgeNumber}!`);
    } else {
      setAuthError(res.error || 'Invalid Gmail or password.');
    }
  };

  // Quick fill for testing
  const handleQuickLoginJudge = (judge) => {
    setEmailInput(judge.email);
    setPasswordInput(judge.password);
    authenticateJudge(judge.email, judge.password);
  };

  // Open / Populate evaluation form for a contender
  const handleToggleExpand = (contender) => {
    if (expandedContenderId === contender.participantId) {
      setExpandedContenderId(null);
      return;
    }

    setExpandedContenderId(contender.participantId);

    // If already evaluated by this judge, load saved values
    const existingEval = currentJudge && contender.judgeMarks?.[currentJudge.id];
    if (existingEval) {
      setScores({
        objectiveScore: existingEval.objectiveScore ?? 25,
        noveltyScore: existingEval.noveltyScore ?? 15,
        presentationScore: existingEval.presentationScore ?? 15,
        tokenScore: existingEval.tokenScore ?? 12,
        timeScore: existingEval.timeScore ?? 8,
        notes: existingEval.notes || '',
      });
    } else {
      // Calculate automated starting scores from daily limit % and time
      const autoToken = calculateTokenScore(contender.dailyLimitPercentageUsed, 100, 15).score;
      const autoTime = calculateTimeScore(contender.finishSeconds, 1200, 10).score;

      setScores({
        objectiveScore: 25,
        noveltyScore: 15,
        presentationScore: 15,
        tokenScore: autoToken || 12,
        timeScore: autoTime || 8,
        notes: '',
      });
    }
  };

  // Save Evaluation
  const handleSaveEvaluation = (contender) => {
    if (!currentJudge) {
      alert('Please log in as an authorized judge first.');
      return;
    }

    const obj = Math.min(35, Math.max(0, Number(scores.objectiveScore) || 0));
    const nov = Math.min(20, Math.max(0, Number(scores.noveltyScore) || 0));
    const pres = Math.min(20, Math.max(0, Number(scores.presentationScore) || 0));
    const tok = Math.min(15, Math.max(0, Number(scores.tokenScore) || 0));
    const tim = Math.min(10, Math.max(0, Number(scores.timeScore) || 0));
    const total = obj + nov + pres + tok + tim;

    submitJudgeEvaluation({
      participantId: contender.participantId,
      judgeId: currentJudge.id,
      marks: {
        objectiveScore: obj,
        noveltyScore: nov,
        presentationScore: pres,
        tokenScore: tok,
        timeScore: tim,
        totalScore: total,
        notes: scores.notes.trim(),
      },
    });

    setSaveSuccessId(contender.participantId);
    setTimeout(() => setSaveSuccessId(null), 3000);
  };

  // ==========================================
  // VIEW 1: JUDGE LOGIN & REGISTRATION GATE
  // ==========================================
  if (!currentJudge) {
    return (
      <div className="w-full max-w-lg mx-auto py-12 px-4 font-mono">
        <div className="p-6 sm:p-8 rounded-3xl bg-dark-900 border border-white/15 shadow-[0_0_60px_rgba(0,0,0,0.85)] space-y-6">
          
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-fest-amber/15 border border-fest-amber/30 text-fest-amber flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(255,183,0,0.3)]">
              <Scale className="w-7 h-7" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-sans text-white uppercase tracking-tight">
              Judge Adjudication Portal
            </h2>
            <p className="text-xs text-slate-400">
              IEEE PES DIU SBC • EEE FEST 2026 Prompt Battle
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-fest-pes/10 border border-fest-pes/30 text-fest-pes text-[11px] font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Adjudication Panel (4 Judges Max)</span>
            </div>
          </div>

          {/* Tab Switcher: Login vs Sign Up */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-dark-950 border border-white/10 text-xs font-bold">
            <button
              onClick={() => { setAuthMode('login'); setAuthError(''); setAuthSuccess(''); }}
              className={`py-2 rounded-lg transition-all ${
                authMode === 'login'
                  ? 'bg-fest-amber text-dark-950 shadow-[0_0_15px_rgba(255,183,0,0.3)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Judge Log In
            </button>
            <button
              onClick={() => { setAuthMode('signup'); setAuthError(''); setAuthSuccess(''); }}
              className={`py-2 rounded-lg transition-all ${
                authMode === 'signup'
                  ? 'bg-fest-amber text-dark-950 shadow-[0_0_15px_rgba(255,183,0,0.3)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {authError && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {authSuccess && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{authSuccess}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={authMode === 'login' ? handleLogin : handleSignUp} className="space-y-4 text-xs">
            {authMode === 'signup' && (
              <div>
                <label className="block text-slate-300 font-bold mb-1 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-fest-cyan" />
                  <span>Full Name (e.g. Dr. John Doe) *</span>
                </label>
                <input
                  type="text"
                  required
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Enter your full name and title..."
                  className="w-full px-3 py-2.5 rounded bg-dark-950 border border-white/15 text-white font-sans text-sm focus:border-fest-amber"
                />
              </div>
            )}

            <div>
              <label className="block text-slate-300 font-bold mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-fest-cyan" />
                <span>Gmail / Official Email *</span>
              </label>
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="Enter your Gmail address"
                className="w-full px-3 py-2.5 rounded bg-dark-950 border border-white/15 text-white font-mono text-sm focus:border-fest-amber"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-fest-amber" />
                <span>Secret Password *</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter your password..."
                  className="w-full px-3 py-2.5 rounded bg-dark-950 border border-white/15 text-white font-mono text-sm focus:border-fest-amber"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-fest-amber to-fest-pes text-dark-950 font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(255,183,0,0.35)] flex items-center justify-center gap-2 hover:opacity-95 text-xs"
            >
              {authMode === 'login' ? (
                <>
                  <Scale className="w-4 h-4" />
                  <span>Log In as Judge</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Create Judge Account ({judges.length}/4)</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Access to Existing Registered Judges */}
          {judges.length > 0 && (
            <div className="pt-3 border-t border-white/10 space-y-2">
              <span className="text-[11px] text-slate-400 block font-bold">
                Registered Judges ({judges.length}/4):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {judges.map((j) => (
                  <button
                    key={j.id}
                    onClick={() => handleQuickLoginJudge(j)}
                    className="p-2 rounded bg-dark-950 border border-white/10 hover:border-fest-amber/40 text-left text-[11px] flex items-center justify-between text-slate-300 hover:text-white transition-colors"
                  >
                    <div>
                      <span className="font-bold text-fest-amber block">Judge #{j.judgeNumber}</span>
                      <span className="text-white text-[10px] truncate max-w-[120px] block">{j.name}</span>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-fest-cyan font-mono">
                      Log In ↗
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => switchView('presentation')}
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              ← Return to Presentation Screen
            </button>
          </div>

        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: JUDGE ADJUDICATION DASHBOARD
  // ==========================================
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-mono">
      
      {/* Top Judge Profile Header */}
      <div className="p-4 sm:p-6 rounded-2xl bg-dark-900 border border-white/15 shadow-[0_0_40px_rgba(0,0,0,0.6)] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-fest-amber/20 border border-fest-amber/40 text-fest-amber flex items-center justify-center shadow-[0_0_20px_rgba(255,183,0,0.3)]">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded bg-fest-amber text-dark-950 font-black text-xs uppercase tracking-wider">
                Judge #{currentJudge.judgeNumber}
              </span>
              <h2 className="text-lg sm:text-xl font-bold font-sans text-white">
                {currentJudge.name}
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Gmail: <span className="text-fest-cyan">{currentJudge.email}</span> • Adjudicator for IEEE PES DIU SBC
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => switchView('presentation')}
            className="px-3 py-1.5 rounded-lg bg-dark-950 border border-white/10 text-slate-300 hover:text-white text-xs transition-colors"
          >
            Auditorium View
          </button>
          <button
            onClick={logoutJudge}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 text-xs transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-dark-900 border border-white/10 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider block">Total Contenders</span>
            <span className="text-2xl font-bold font-sans text-white">{unifiedContenders.length}</span>
          </div>
          <Award className="w-8 h-8 text-fest-cyan/40" />
        </div>

        <div className="p-4 rounded-xl bg-dark-900 border border-emerald-500/30 flex items-center justify-between">
          <div>
            <span className="text-xs text-emerald-400 uppercase tracking-wider block">Evaluated by You</span>
            <span className="text-2xl font-bold font-sans text-emerald-300">{evaluatedCount}</span>
          </div>
          <CheckCircle2 className="w-8 h-8 text-emerald-500/40" />
        </div>

        <div className="p-4 rounded-xl bg-dark-900 border border-fest-amber/30 flex items-center justify-between">
          <div>
            <span className="text-xs text-fest-amber uppercase tracking-wider block">Pending Your Grade</span>
            <span className="text-2xl font-bold font-sans text-fest-amber">{pendingCount}</span>
          </div>
          <Clock className="w-8 h-8 text-fest-amber/40" />
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="p-4 rounded-xl bg-dark-900 border border-white/10 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Contender Name, Participant ID, Desk, or Email..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-dark-950 border border-white/15 text-white text-xs focus:border-fest-amber placeholder-slate-500"
          />
        </div>

        <div className="flex items-center space-x-1 p-1 bg-dark-950 rounded-lg border border-white/10 text-xs">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1 rounded transition-colors ${
              filterMode === 'all' ? 'bg-fest-amber text-dark-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({unifiedContenders.length})
          </button>
          <button
            onClick={() => setFilterMode('pending')}
            className={`px-3 py-1 rounded transition-colors ${
              filterMode === 'pending' ? 'bg-fest-amber text-dark-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setFilterMode('evaluated')}
            className={`px-3 py-1 rounded transition-colors ${
              filterMode === 'evaluated' ? 'bg-fest-amber text-dark-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Evaluated ({evaluatedCount})
          </button>
        </div>
      </div>

      {/* Contender Evaluation Cards List */}
      <div className="space-y-4">
        {filteredContenders.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-dark-900 border border-white/10 space-y-2">
            <Scale className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-300">No Contenders Match Filters</h3>
            <p className="text-xs text-slate-500">
              Ensure contenders have registered or check your active search term.
            </p>
          </div>
        ) : (
          filteredContenders.map((contender) => {
            const isExpanded = expandedContenderId === contender.participantId;
            const myEval = contender.judgeMarks?.[currentJudge.id];
            const hasEvaluated = !!myEval;

            return (
              <div 
                key={contender.participantId}
                className={`rounded-2xl border transition-all overflow-hidden ${
                  isExpanded
                    ? 'bg-dark-900 border-fest-amber/50 shadow-[0_0_30px_rgba(255,183,0,0.15)]'
                    : hasEvaluated
                    ? 'bg-dark-900/80 border-emerald-500/30 hover:border-emerald-500/60'
                    : 'bg-dark-900/60 border-white/10 hover:border-white/20'
                }`}
              >
                {/* Header Row */}
                <div 
                  onClick={() => handleToggleExpand(contender)}
                  className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    {/* Desk Station Pill */}
                    <span className="px-3 py-1.5 rounded-xl bg-fest-amber/20 border border-fest-amber/40 text-fest-amber font-extrabold text-xs flex items-center gap-1.5 shrink-0 shadow-[0_0_10px_rgba(255,183,0,0.2)]">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{contender.deskNumber || 'Desk 01'}</span>
                    </span>

                    <div className="min-w-0 truncate">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-base truncate font-sans">
                          {contender.name}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-fest-cyan/15 text-fest-cyan border border-fest-cyan/30 text-[11px] font-bold">
                          {contender.participantId}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="text-fest-pink">{contender.teamName || 'Solo'}</span>
                        {contender.email && <span>• {contender.email}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Right Status Pill & Score */}
                  <div className="flex items-center space-x-3 shrink-0">
                    {hasEvaluated ? (
                      <div className="text-right">
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Your Grade: {myEval.totalScore}/100</span>
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Avg: {contender.totalScore} pts ({contender.evaluatedByJudgesCount || 1} judges)
                        </span>
                      </div>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-fest-amber/15 border border-fest-amber/30 text-fest-amber text-xs font-bold flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Pending Grade</span>
                      </span>
                    )}

                    <div className="p-1 rounded bg-white/5 text-slate-400">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Evaluation Body */}
                {isExpanded && (
                  <div className="p-5 border-t border-white/10 bg-dark-950/70 space-y-5 animate-in fade-in duration-200">
                    
                    {/* Contender Submission Work Preview */}
                    <div className="p-4 rounded-xl bg-dark-900 border border-white/10 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-fest-pink" />
                          <span>Contender Submitted Work & Verification</span>
                        </span>
                        {contender.submittedUrl ? (
                          <a
                            href={contender.submittedUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-fest-cyan/15 text-fest-cyan hover:bg-fest-cyan/25 border border-fest-cyan/30 text-xs font-bold transition-all shadow-[0_0_12px_rgba(0,229,255,0.2)]"
                          >
                            <span>Open Contender Project Link</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">No link submitted yet</span>
                        )}
                      </div>

                      {/* Work stats */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                        <div className="p-2 rounded bg-dark-950 border border-white/5">
                          <span className="text-[10px] text-slate-400 block">Antigravity Daily %:</span>
                          <span className="font-bold text-fest-pink">{contender.dailyLimitPercentageUsed}%</span>
                        </div>
                        <div className="p-2 rounded bg-dark-950 border border-white/5">
                          <span className="text-[10px] text-slate-400 block">Submission Time:</span>
                          <span className="font-bold text-fest-cyan">{contender.finishTimeFormatted}</span>
                        </div>
                        <div className="p-2 rounded bg-dark-950 border border-white/5">
                          <span className="text-[10px] text-slate-400 block">Auto Token Score:</span>
                          <span className="font-bold text-fest-pes">{calculateTokenScore(contender.dailyLimitPercentageUsed, 100, 15).score}/15 pts</span>
                        </div>
                        <div className="p-2 rounded bg-dark-950 border border-white/5">
                          <span className="text-[10px] text-slate-400 block">Auto Time Score:</span>
                          <span className="font-bold text-fest-amber">{calculateTimeScore(contender.finishSeconds, 1200, 10).score}/10 pts</span>
                        </div>
                      </div>
                    </div>

                    {/* Official Judge Rubric Scoring Form */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-1 border-b border-white/10">
                        <span className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                          <Scale className="w-4 h-4 text-fest-amber" />
                          <span>Judge #{currentJudge.judgeNumber} Scoring Rubric (Total: 100 Points)</span>
                        </span>
                        <span className="text-base font-extrabold text-fest-amber font-mono">
                          Total: {(Number(scores.objectiveScore) || 0) + 
                                  (Number(scores.noveltyScore) || 0) + 
                                  (Number(scores.presentationScore) || 0) + 
                                  (Number(scores.tokenScore) || 0) + 
                                  (Number(scores.timeScore) || 0)} / 100 Pts
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* 1. Objective Fulfillment (0 - 35) */}
                        <div className="p-3.5 rounded-xl bg-dark-900 border border-white/10 space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-white">1. Objective & Challenge Alignment</span>
                            <span className="text-fest-cyan font-bold font-mono">{scores.objectiveScore} / 35 Pts</span>
                          </div>
                          <p className="text-[10px] text-slate-400">
                            Accuracy of output, prompt constraint handling, and task fulfillment.
                          </p>
                          <input
                            type="range"
                            min="0"
                            max="35"
                            value={scores.objectiveScore}
                            onChange={(e) => setScores({ ...scores, objectiveScore: Number(e.target.value) })}
                            className="w-full accent-fest-cyan cursor-pointer"
                          />
                        </div>

                        {/* 2. Novelty & Creativity (0 - 20) */}
                        <div className="p-3.5 rounded-xl bg-dark-900 border border-white/10 space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-white">2. Idea Novelty & Prompt Craft</span>
                            <span className="text-fest-pink font-bold font-mono">{scores.noveltyScore} / 20 Pts</span>
                          </div>
                          <p className="text-[10px] text-slate-400">
                            CoT techniques, persona anchoring, guardrail schemas, and creativity.
                          </p>
                          <input
                            type="range"
                            min="0"
                            max="20"
                            value={scores.noveltyScore}
                            onChange={(e) => setScores({ ...scores, noveltyScore: Number(e.target.value) })}
                            className="w-full accent-fest-pink cursor-pointer"
                          />
                        </div>

                        {/* 3. Presentation & Defense (0 - 20) */}
                        <div className="p-3.5 rounded-xl bg-dark-900 border border-white/10 space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-white">3. Explainability & Station Defense</span>
                            <span className="text-fest-amber font-bold font-mono">{scores.presentationScore} / 20 Pts</span>
                          </div>
                          <p className="text-[10px] text-slate-400">
                            Contender explanation of model choices, token reasoning, and prompt defense.
                          </p>
                          <input
                            type="range"
                            min="0"
                            max="20"
                            value={scores.presentationScore}
                            onChange={(e) => setScores({ ...scores, presentationScore: Number(e.target.value) })}
                            className="w-full accent-fest-amber cursor-pointer"
                          />
                        </div>

                        {/* 4. Token Efficiency (0 - 15) */}
                        <div className="p-3.5 rounded-xl bg-dark-900 border border-white/10 space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-white">4. Antigravity Token Efficiency</span>
                            <span className="text-fest-pes font-bold font-mono">{scores.tokenScore} / 15 Pts</span>
                          </div>
                          <p className="text-[10px] text-slate-400">
                            Based on daily limit % used in Antigravity (less used = higher score).
                          </p>
                          <input
                            type="range"
                            min="0"
                            max="15"
                            value={scores.tokenScore}
                            onChange={(e) => setScores({ ...scores, tokenScore: Number(e.target.value) })}
                            className="w-full accent-fest-pes cursor-pointer"
                          />
                        </div>

                        {/* 5. Time Velocity (0 - 10) */}
                        <div className="p-3.5 rounded-xl bg-dark-900 border border-white/10 space-y-2 md:col-span-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-white">5. Velocity / Submission Time Speed</span>
                            <span className="text-fest-cyan font-bold font-mono">{scores.timeScore} / 10 Pts</span>
                          </div>
                          <p className="text-[10px] text-slate-400">
                            Early finishes receive higher marks; late submissions receive lower velocity marks.
                          </p>
                          <input
                            type="range"
                            min="0"
                            max="10"
                            value={scores.timeScore}
                            onChange={(e) => setScores({ ...scores, timeScore: Number(e.target.value) })}
                            className="w-full accent-fest-cyan cursor-pointer"
                          />
                        </div>

                      </div>

                      {/* Judge Qualitative Feedback */}
                      <div>
                        <label className="block text-slate-300 font-bold mb-1.5 text-xs">
                          Judge Notes & Qualitative Remarks (Optional):
                        </label>
                        <textarea
                          rows={2}
                          value={scores.notes}
                          onChange={(e) => setScores({ ...scores, notes: e.target.value })}
                          placeholder="e.g. Excellent CoT breakdown; very efficient token utilization..."
                          className="w-full px-3 py-2 rounded-lg bg-dark-950 border border-white/15 text-white text-xs focus:border-fest-amber placeholder-slate-500"
                        />
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-2">
                        {saveSuccessId === contender.participantId ? (
                          <span className="text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                            <Check className="w-4 h-4" />
                            <span>Evaluation Saved Successfully!</span>
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">
                            Ready to record score for Judge #{currentJudge.judgeNumber}
                          </span>
                        )}

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setExpandedContenderId(null)}
                            className="px-3 py-2 rounded-lg bg-dark-950 border border-white/10 text-slate-400 hover:text-white text-xs transition-colors"
                          >
                            Close
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEvaluation(contender)}
                            className="px-5 py-2 rounded-lg bg-gradient-to-r from-fest-amber to-fest-pes text-dark-950 font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(255,183,0,0.4)] flex items-center gap-2 hover:opacity-95 transition-all"
                          >
                            <Save className="w-4 h-4" />
                            <span>Save Evaluation</span>
                          </button>
                        </div>
                      </div>

                    </div>

                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
