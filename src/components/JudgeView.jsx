import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useBattle } from '../context/BattleContext';
import { 
  Scale, 
  UserCheck, 
  Lock, 
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
  MapPin, 
  Check, 
  UserPlus, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp,
  AlertTriangle,
  Ban,
  RotateCcw,
  Sliders,
  CheckCircle,
  FileText,
  Copy
} from 'lucide-react';
import { calculateAutomatedTimeScore } from '../lib/scoringCalculator';

export default function JudgeView() {
  const { 
    judges = [], 
    currentJudge, 
    registerJudge, 
    authenticateJudge, 
    logoutJudge, 
    submitJudgeEvaluation, 
    expelParticipant,
    reinstateParticipant,
    registeredContenders = [], 
    participants = [],
    timer,
    switchView,
    verificationPrompt,
    toggleVerificationPromptForParticipant
  } = useBattle();

  // Auth Mode: 'login' | 'signup'
  const [authMode, setAuthMode] = useState('login');
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [copiedPromptId, setCopiedPromptId] = useState(null);

  // Aggressively clear authentication inputs on mount to defeat browser credential autofill
  useEffect(() => {
    setEmailInput('');
    setPasswordInput('');
    setNameInput('');
    const t1 = setTimeout(() => {
      setEmailInput('');
      setPasswordInput('');
      setNameInput('');
    }, 50);
    const t2 = setTimeout(() => {
      setEmailInput('');
      setPasswordInput('');
      setNameInput('');
    }, 200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // Search & Filter: 'all' | 'submitted' | 'pending' | 'evaluated' | 'expelled'
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState('all');

  // Evaluation Form State for actively expanded contender
  const [expandedContenderId, setExpandedContenderId] = useState(null);
  
  // Official Rubric:
  // Prompt (50), Project Working (25: 5+5+5+5+5), Time Management (10 auto), Presentation (10), Token (5) = 100
  // Initial values are empty until entered manually by the judge
  const [scores, setScores] = useState({
    promptScore: '',
    projectAccuracy: '',
    projectSimulation: '',
    projectMonitoring: '',
    projectUsability: '',
    projectComponents: '',
    presentationScore: '',
    tokenScore: '',
    notes: '',
  });

  const [autoSaveStatus, setAutoSaveStatus] = useState(null); // 'saving' | 'saved' | null
  const [lastSavedTime, setLastSavedTime] = useState('');
  const debounceTimerRef = useRef(null);

  // Combine registered contenders and submitted participants into unified contender list (Strictly all 64 Desks)
  const unifiedContenders = useMemo(() => {
    const roster = (registeredContenders && registeredContenders.length === 64) 
      ? registeredContenders 
      : INITIAL_ROSTER;

    return roster.map((rc) => {
      const coupon = (rc.couponCode || rc.passcode || '').trim().toUpperCase();
      const desk = (rc.deskNumber || '').trim();
      const studentId = (rc.studentId || rc.participantId || '').trim().toUpperCase();

      // Find any live submission that matches this specific station
      const sub = (participants || []).find((p) => {
        const pCoupon = (p.couponCode || '').trim().toUpperCase();
        const pDesk = (p.deskNumber || '').trim().toLowerCase();
        const pId = (p.participantId || p.id || '').trim().toUpperCase();

        if (coupon && pCoupon && coupon === pCoupon) return true;
        if (desk && pDesk && desk.toLowerCase() === pDesk.toLowerCase()) return true;
        if (studentId && pId && studentId === pId) return true;
        return false;
      });

      const hasSub = Boolean(sub && (sub.submittedUrl || sub.workUrl || sub.hasSubmitted || (sub.finishSeconds && sub.finishSeconds > 0)));

      // Primary judge evaluator (if any)
      const judgeMarks = sub?.judgeMarks || {};
      const evalList = Object.values(judgeMarks);
      const primaryEval = evalList[0] || null;

      return {
        ...rc,
        ...(sub || {}),
        id: coupon || desk || rc.participantId,
        stationKey: coupon || desk,
        participantId: rc.participantId || studentId,
        studentId: rc.studentId || studentId,
        couponCode: coupon,
        deskNumber: desk,
        name: sub?.name || rc.name,
        teamName: sub?.teamName || rc.teamName || 'Solo Contender',
        email: rc.email || rc.studentMail || '',
        submittedUrl: sub?.submittedUrl || sub?.workUrl || sub?.promptUrl || '',
        tokensUsed: Number(sub?.tokensUsed) || 0,
        dailyLimitPercentageUsed: Number(sub?.dailyLimitPercentageUsed ?? sub?.tokensUsed) || 0,
        finishTimeFormatted: sub?.finishTimeFormatted || 'Not submitted',
        finishSeconds: Number(sub?.finishSeconds) || 0,
        hasSubmitted: hasSub,
        isDisqualified: Boolean(sub?.isDisqualified),
        isExpelled: Boolean(sub?.isExpelled),
        disqualificationReason: sub?.disqualificationReason || null,
        judgeMarks: judgeMarks,
        primaryEval: primaryEval,
        markedByJudgeName: sub?.markedByJudgeName || primaryEval?.judgeName || null,
        totalScore: Boolean(sub?.isDisqualified || sub?.isExpelled) ? 0 : Number(sub?.totalScore) || 0,
      };
    }).sort((a, b) => {
      const deskA = parseInt(String(a.deskNumber || '').replace(/\D/g, ''), 10) || 0;
      const deskB = parseInt(String(b.deskNumber || '').replace(/\D/g, ''), 10) || 0;
      return deskA - deskB;
    });
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
        c.couponCode?.toLowerCase().includes(term) ||
        c.email?.toLowerCase().includes(term);

      if (!matchSearch) return false;

      const myEval = currentJudge && c.judgeMarks && c.judgeMarks[currentJudge.id];
      const hasAnyEval = Boolean(c.primaryEval || (c.judgeMarks && Object.keys(c.judgeMarks).length > 0));

      if (filterMode === 'submitted') return c.hasSubmitted && !c.isExpelled;
      if (filterMode === 'pending') return c.hasSubmitted && !hasAnyEval && !c.isExpelled;
      if (filterMode === 'evaluated') return hasAnyEval && !c.isExpelled;
      if (filterMode === 'expelled') return c.isExpelled || c.isDisqualified;
      return true;
    });
  }, [unifiedContenders, searchTerm, filterMode, currentJudge]);

  // KPI calculations
  const evaluatedCount = useMemo(() => {
    return unifiedContenders.filter((c) => c.primaryEval && !c.isExpelled).length;
  }, [unifiedContenders]);

  const submittedCount = useMemo(() => {
    return unifiedContenders.filter((c) => c.hasSubmitted && !c.isExpelled).length;
  }, [unifiedContenders]);

  const pendingCount = useMemo(() => {
    return unifiedContenders.filter((c) => c.hasSubmitted && !c.primaryEval && !c.isExpelled).length;
  }, [unifiedContenders]);

  const expelledCount = useMemo(() => {
    return unifiedContenders.filter((c) => c.isExpelled || c.isDisqualified).length;
  }, [unifiedContenders]);

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

  // Handle Judge Login (strict verification - no bypass)
  const handleLogin = (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    const res = authenticateJudge(emailInput.trim(), passwordInput.trim());

    if (res.success) {
      setAuthSuccess(`Welcome back, Judge #${res.judge.judgeNumber}!`);
    } else {
      setAuthError(res.error || 'Invalid Email or password. Please verify credentials.');
    }
  };

  // Open / Populate evaluation form for a contender
  const handleToggleExpand = (contender) => {
    const stationId = contender.stationKey || contender.couponCode || contender.participantId;
    if (expandedContenderId === stationId) {
      setExpandedContenderId(null);
      return;
    }

    setExpandedContenderId(stationId);
    setAutoSaveStatus(null);

    // If already evaluated by this judge or another judge, load saved values for inspection
    const existingEval = (currentJudge && contender.judgeMarks?.[currentJudge.id]) || contender.primaryEval;
    if (existingEval) {
      setScores({
        promptScore: existingEval.promptScore !== undefined ? existingEval.promptScore : (existingEval.objectiveScore ?? ''),
        projectAccuracy: existingEval.projectAccuracy !== undefined ? existingEval.projectAccuracy : '',
        projectSimulation: existingEval.projectSimulation !== undefined ? existingEval.projectSimulation : '',
        projectMonitoring: existingEval.projectMonitoring !== undefined ? existingEval.projectMonitoring : '',
        projectUsability: existingEval.projectUsability !== undefined ? existingEval.projectUsability : '',
        projectComponents: existingEval.projectComponents !== undefined ? existingEval.projectComponents : '',
        presentationScore: existingEval.presentationScore !== undefined ? existingEval.presentationScore : '',
        tokenScore: existingEval.tokenScore !== undefined ? existingEval.tokenScore : '',
        notes: existingEval.notes || '',
      });
      if (existingEval.evaluatedAt) {
        setLastSavedTime(new Date(existingEval.evaluatedAt).toLocaleTimeString());
      }
    } else {
      // Default to empty strings so no numbers are pre-filled
      setScores({
        promptScore: '',
        projectAccuracy: '',
        projectSimulation: '',
        projectMonitoring: '',
        projectUsability: '',
        projectComponents: '',
        presentationScore: '',
        tokenScore: '',
        notes: '',
      });
      setLastSavedTime('');
    }
  };

  // Auto-Save Handler on any input change
  const handleScoreChange = (field, value, contender) => {
    // Block input modifications if another judge already evaluated this student
    const isMarkedByOther = Boolean(
      contender.primaryEval && currentJudge && contender.primaryEval.judgeId !== currentJudge.id
    );
    if (isMarkedByOther) return;

    let parsedVal = value;
    if (field !== 'notes') {
      if (value === '') {
        parsedVal = '';
      } else {
        const num = Number(value);
        parsedVal = isNaN(num) ? '' : Math.max(0, num);
      }
    }

    const updated = {
      ...scores,
      [field]: parsedVal,
    };
    setScores(updated);

    // Only auto-save if contender has submitted, not expelled, and NOT already marked by another judge
    if (!currentJudge || !contender.hasSubmitted || contender.isExpelled) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setAutoSaveStatus('saving');

    debounceTimerRef.current = setTimeout(() => {
      saveEvaluationDirectly(updated, contender);
    }, 400);
  };

  // Direct Save helper
  const saveEvaluationDirectly = (scoresToSave, contender) => {
    if (!currentJudge || !contender.hasSubmitted || contender.isExpelled) return;

    // Single faculty judge enforcement: if another judge already graded this student, block overwrite
    const isMarkedByOther = Boolean(
      contender.primaryEval && currentJudge && contender.primaryEval.judgeId !== currentJudge.id
    );
    if (isMarkedByOther) {
      console.warn('Evaluation blocked: Student already evaluated by ' + contender.primaryEval.judgeName);
      return;
    }

    const duration = timer?.duration || 1200;
    const autoTime = calculateAutomatedTimeScore(contender.finishSeconds, duration, true);
    const timeScore = autoTime.isDisqualified ? 0 : autoTime.score;

    const parseNum = (v, max) => Math.min(max, Math.max(0, v === '' ? 0 : Number(v) || 0));

    const prompt = parseNum(scoresToSave.promptScore, 50);
    const acc = parseNum(scoresToSave.projectAccuracy, 5);
    const sim = parseNum(scoresToSave.projectSimulation, 5);
    const mon = parseNum(scoresToSave.projectMonitoring, 5);
    const usa = parseNum(scoresToSave.projectUsability, 5);
    const comp = parseNum(scoresToSave.projectComponents, 5);
    const pres = parseNum(scoresToSave.presentationScore, 10);
    const tok = parseNum(scoresToSave.tokenScore, 5);
    
    const projectTotal = acc + sim + mon + usa + comp; // 25 max
    const total = prompt + projectTotal + timeScore + pres + tok; // 100 max

    submitJudgeEvaluation({
      participantId: contender.participantId,
      deskNumber: contender.deskNumber,
      judgeId: currentJudge.id,
      marks: {
        promptScore: prompt,
        projectAccuracy: acc,
        projectSimulation: sim,
        projectMonitoring: mon,
        projectUsability: usa,
        projectComponents: comp,
        presentationScore: pres,
        tokenScore: tok,
        timeScore: timeScore,
        totalScore: total,
        notes: (scoresToSave.notes || '').trim(),
      },
    });

    const timeStr = new Date().toLocaleTimeString();
    setLastSavedTime(timeStr);
    setAutoSaveStatus('saved');
  };

  // Manual explicit save button
  const handleManualSave = (contender) => {
    if (!currentJudge) {
      alert('Please log in as an authorized judge first.');
      return;
    }
    if (!contender.hasSubmitted) {
      alert('Cannot mark a participant who has not submitted their project yet.');
      return;
    }
    const isMarkedByOther = Boolean(
      contender.primaryEval && currentJudge && contender.primaryEval.judgeId !== currentJudge.id
    );
    if (isMarkedByOther) {
      alert(`⚠️ DOUBLE MARKING BLOCKED:\n\nThis student has already been evaluated by ${contender.primaryEval.judgeName} (${contender.primaryEval.totalScore}/100 pts).\n\nOnly one faculty judge is allowed to evaluate per student.`);
      return;
    }
    saveEvaluationDirectly(scores, contender);
  };

  // Expel Participant for Cheating
  const handleExpelClick = (contender) => {
    if (!currentJudge) return;
    const confirmExpel = window.confirm(
      `⚠️ EXPEL PARTICIPANT WARNING:\n\nAre you sure you want to expel ${contender.name} (${contender.participantId}) for cheating / academic dishonesty?\n\nTheir score will be reduced to 0 and their status will show "EXPELLED (CHEATING)" across all leaderboards and projector screens.`
    );
    if (!confirmExpel) return;

    expelParticipant({
      participantId: contender.participantId,
      deskNumber: contender.deskNumber,
      reason: 'Caught cheating / academic dishonesty in Prompt Battle',
      judgeName: currentJudge.name || `Judge #${currentJudge.judgeNumber}`,
    });
    setExpandedContenderId(null);
  };

  // Reinstate Expelled Participant
  const handleReinstateClick = (contender) => {
    const confirmReinstate = window.confirm(
      `Reinstate ${contender.name} (${contender.participantId}) back into active competition status?`
    );
    if (!confirmReinstate) return;

    reinstateParticipant(contender.participantId, contender.deskNumber);
  };

  // ==========================================
  // VIEW 1: JUDGE LOGIN & REGISTRATION GATE
  // ==========================================
  if (!currentJudge) {
    return (
      <div className="w-full max-w-lg mx-auto py-12 px-4 font-mono">
        <div className="p-6 sm:p-8 rounded-3xl bg-dark-900 border border-white/15 shadow-[0_0_60px_rgba(0,0,0,0.85)] space-y-6">
          
          {/* Universal 3-Role Switcher: Participant | Judge (Active) | Admin */}
          <div className="grid grid-cols-3 p-1 rounded-xl bg-dark-950 border border-white/10 text-xs font-bold font-mono">
            <button
              type="button"
              onClick={() => switchView('submit')}
              className="py-2 px-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all text-center truncate"
            >
              Participant
            </button>
            <button
              type="button"
              className="py-2 px-1 rounded-lg bg-fest-amber text-dark-950 shadow-[0_0_15px_rgba(255,183,0,0.3)] text-center truncate font-black"
            >
              Judge
            </button>
            <button
              type="button"
              onClick={() => switchView('admin')}
              className="py-2 px-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all text-center truncate"
            >
              Admin
            </button>
          </div>

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
              <span>Official Faculty Adjudication Panel</span>
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

          {/* Form: No bypass, strict email + password authentication */}
          <form onSubmit={authMode === 'login' ? handleLogin : handleSignUp} autoComplete="off" className="space-y-4 text-xs">
            {/* Decoy hidden inputs to thwart aggressive browser credential autofill */}
            <input 
              type="text" 
              name="decoy_judge_prevent_autofill_user" 
              style={{ display: 'none', position: 'absolute', opacity: 0 }} 
              tabIndex="-1" 
              autoComplete="off" 
            />
            <input 
              type="password" 
              name="decoy_judge_prevent_autofill_pwd" 
              style={{ display: 'none', position: 'absolute', opacity: 0 }} 
              tabIndex="-1" 
              autoComplete="off" 
            />

            {authMode === 'signup' && (
              <div>
                <label className="block text-slate-300 font-bold mb-1 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-fest-cyan" />
                  <span>Full Name & Academic Title *</span>
                </label>
                <input
                  type="text"
                  name="judge_new_account_full_name"
                  required
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  autoComplete="off"
                  placeholder="Enter full name and title (e.g. Dr. Srimanti Roy Choudhury)..."
                  className="w-full px-3 py-2.5 rounded bg-dark-950 border border-white/15 text-white font-sans text-sm focus:border-fest-amber"
                />
              </div>
            )}

            <div>
              <label className="block text-slate-300 font-bold mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-fest-cyan" />
                <span>Official Faculty Email / Gmail *</span>
              </label>
              <input
                type="email"
                name="judge_auth_login_official_email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                placeholder="Enter your official email (e.g. srimanti.eee@diu.edu.bd)..."
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
                  name="judge_auth_secret_password_token"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  autoComplete="new-password"
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
              Official Email: <span className="text-fest-cyan">{currentJudge.email}</span> • Adjudicator for IEEE PES DIU SBC
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-dark-900 border border-white/10 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider block">Total Roster</span>
            <span className="text-2xl font-bold font-sans text-white">{unifiedContenders.length}</span>
          </div>
          <Award className="w-7 h-7 text-fest-cyan/40" />
        </div>

        <div className="p-4 rounded-xl bg-dark-900 border border-fest-cyan/30 flex items-center justify-between">
          <div>
            <span className="text-xs text-fest-cyan uppercase tracking-wider block">Submitted</span>
            <span className="text-2xl font-bold font-sans text-fest-cyan">{submittedCount}</span>
          </div>
          <Sparkles className="w-7 h-7 text-fest-cyan/40" />
        </div>

        <div className="p-4 rounded-xl bg-dark-900 border border-emerald-500/30 flex items-center justify-between">
          <div>
            <span className="text-xs text-emerald-400 uppercase tracking-wider block">Graded by You</span>
            <span className="text-2xl font-bold font-sans text-emerald-300">{evaluatedCount}</span>
          </div>
          <CheckCircle2 className="w-7 h-7 text-emerald-500/40" />
        </div>

        <div className="p-4 rounded-xl bg-dark-900 border border-fest-amber/30 flex items-center justify-between">
          <div>
            <span className="text-xs text-fest-amber uppercase tracking-wider block">Awaiting Grade</span>
            <span className="text-2xl font-bold font-sans text-fest-amber">{pendingCount}</span>
          </div>
          <Clock className="w-7 h-7 text-fest-amber/40" />
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
            placeholder="Search by Participant Name, ID (e.g. 242-33-218), Desk, or Email..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-dark-950 border border-white/15 text-white text-xs focus:border-fest-amber placeholder-slate-500"
          />
        </div>

        <div className="flex items-center space-x-1 p-1 bg-dark-950 rounded-lg border border-white/10 text-xs flex-wrap">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1 rounded transition-colors ${
              filterMode === 'all' ? 'bg-fest-amber text-dark-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({unifiedContenders.length})
          </button>
          <button
            onClick={() => setFilterMode('submitted')}
            className={`px-3 py-1 rounded transition-colors ${
              filterMode === 'submitted' ? 'bg-fest-amber text-dark-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Submitted ({submittedCount})
          </button>
          <button
            onClick={() => setFilterMode('pending')}
            className={`px-3 py-1 rounded transition-colors ${
              filterMode === 'pending' ? 'bg-fest-amber text-dark-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Pending Grade ({pendingCount})
          </button>
          <button
            onClick={() => setFilterMode('evaluated')}
            className={`px-3 py-1 rounded transition-colors ${
              filterMode === 'evaluated' ? 'bg-fest-amber text-dark-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Evaluated ({evaluatedCount})
          </button>
          {expelledCount > 0 && (
            <button
              onClick={() => setFilterMode('expelled')}
              className={`px-3 py-1 rounded transition-colors ${
                filterMode === 'expelled' ? 'bg-rose-500 text-white font-bold' : 'text-rose-400 hover:text-rose-200'
              }`}
            >
              Expelled / Late ({expelledCount})
            </button>
          )}
        </div>
      </div>

      {/* Participant Evaluation Cards List */}
      <div className="space-y-4">
        {filteredContenders.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-dark-900 border border-white/10 space-y-2">
            <Scale className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-300">No Participants Found</h3>
            <p className="text-xs text-slate-500">
              Ensure participants have submitted or check your active search filter.
            </p>
          </div>
        ) : (
          filteredContenders.map((contender) => {
            const stationKey = contender.stationKey || contender.couponCode || contender.participantId;
            const isExpanded = expandedContenderId === stationKey;
            const myEval = currentJudge && contender.judgeMarks?.[currentJudge.id];
            const primaryEval = contender.primaryEval;
            const isMarkedByMe = Boolean(myEval);
            const isMarkedByOther = Boolean(primaryEval && currentJudge && primaryEval.judgeId !== currentJudge.id);
            const duration = timer?.duration || 1200;
            const autoTimeResult = calculateAutomatedTimeScore(contender.finishSeconds, duration, contender.hasSubmitted);

            // Live sum calculation for expanded card
            const liveProjectTotal = 
              (Number(scores.projectAccuracy) || 0) +
              (Number(scores.projectSimulation) || 0) +
              (Number(scores.projectMonitoring) || 0) +
              (Number(scores.projectUsability) || 0) +
              (Number(scores.projectComponents) || 0);

            const liveTotal = 
              (Number(scores.promptScore) || 0) +
              liveProjectTotal +
              (autoTimeResult.isDisqualified ? 0 : autoTimeResult.score) +
              (Number(scores.presentationScore) || 0) +
              (Number(scores.tokenScore) || 0);

            return (
              <div 
                key={stationKey}
                className={`rounded-2xl border transition-all overflow-hidden ${
                  contender.isExpelled
                    ? 'bg-rose-950/20 border-rose-500/40'
                    : isExpanded
                    ? 'bg-dark-900 border-fest-amber/50 shadow-[0_0_30px_rgba(255,183,0,0.15)]'
                    : isMarkedByMe
                    ? 'bg-dark-900/80 border-emerald-500/30 hover:border-emerald-500/60'
                    : isMarkedByOther
                    ? 'bg-dark-900/80 border-blue-500/30 hover:border-blue-500/60'
                    : contender.hasSubmitted
                    ? 'bg-dark-900/70 border-fest-cyan/30 hover:border-fest-cyan/60'
                    : 'bg-dark-900/50 border-white/10 opacity-75'
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
                        {contender.isExpelled && (
                          <span className="px-2 py-0.5 rounded bg-rose-500 text-white font-black text-[10px] uppercase tracking-wider animate-pulse">
                            EXPELLED
                          </span>
                        )}
                        {!contender.isExpelled && contender.isDisqualified && (
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold uppercase">
                            TIME EXPIRED
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="text-fest-pink">{contender.teamName || 'Solo'}</span>
                        {contender.email && <span>• {contender.email}</span>}
                        {contender.hasSubmitted ? (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            <span>Submitted ({contender.finishTimeFormatted})</span>
                          </span>
                        ) : (
                          <span className="text-slate-500 italic">Not submitted yet</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Status Pill & Score */}
                  <div className="flex items-center space-x-3 shrink-0">
                    {contender.isExpelled ? (
                      <span className="px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold">
                        Score: 0 / 100 (Expelled)
                      </span>
                    ) : isMarkedByMe ? (
                      <div className="text-right">
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Marked by You ({myEval.totalScore}/100)</span>
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Single Faculty Evaluation Complete
                        </span>
                      </div>
                    ) : isMarkedByOther ? (
                      <div className="text-right">
                        <span className="px-2.5 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-bold flex items-center gap-1.5 shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                          <Lock className="w-3.5 h-3.5 text-blue-400" />
                          <span>Marked by {primaryEval.judgeName}</span>
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Score: {primaryEval.totalScore}/100 pts (Double-mark locked)
                        </span>
                      </div>
                    ) : contender.hasSubmitted ? (
                      <span className="px-2.5 py-1 rounded-full bg-fest-amber/15 border border-fest-amber/30 text-fest-amber text-xs font-bold flex items-center gap-1.5 shadow-[0_0_10px_rgba(255,183,0,0.2)]">
                        <Clock className="w-3.5 h-3.5 text-fest-amber" />
                        <span>Ready to Grade</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-500 text-xs">
                        Awaiting Submission
                      </span>
                    )}

                    <div className="p-1 rounded bg-white/5 text-slate-400">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Evaluation Body */}
                {isExpanded && (
                  <div className="p-5 border-t border-white/10 bg-dark-950/80 space-y-5 animate-in fade-in duration-200">
                    
                    {/* EXPELLED BANNER (If participant was caught cheating) */}
                    {contender.isExpelled && (
                      <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/40 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5 text-rose-300">
                          <Ban className="w-5 h-5 text-rose-400 shrink-0" />
                          <div>
                            <span className="font-bold block uppercase tracking-wider text-rose-200">
                              Participant Expelled for Cheating
                            </span>
                            <span className="text-[11px] text-rose-300/80">
                              {contender.disqualificationReason || 'Academic dishonesty recorded by adjudication panel.'}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleReinstateClick(contender)}
                          className="px-3 py-1.5 rounded-lg bg-dark-950 border border-white/20 text-slate-200 hover:text-white text-xs font-bold"
                        >
                          Reinstate Participant
                        </button>
                      </div>
                    )}

                    {/* SUBMISSION STATUS & WORK PREVIEW */}
                    <div className="p-4 rounded-xl bg-dark-900 border border-white/10 space-y-2.5">
                      <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                        <span className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-fest-pink" />
                          <span>Participant Submitted Project & Work Verification</span>
                        </span>

                        {contender.submittedUrl ? (
                          <a
                            href={contender.submittedUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-fest-cyan/15 text-fest-cyan hover:bg-fest-cyan/25 border border-fest-cyan/30 text-xs font-bold transition-all shadow-[0_0_12px_rgba(0,229,255,0.2)]"
                          >
                            <span>Open Project / Prompt URL</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        ) : contender.hasSubmitted ? (
                          <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/30 font-bold flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Live Work Active at {contender.deskNumber || 'Desk'}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 bg-white/5 px-2.5 py-1 rounded border border-white/10">
                            Awaiting Submission from Desk
                          </span>
                        )}
                      </div>

                      {/* Work stats */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                        <div className="p-2 rounded bg-dark-950 border border-white/5">
                          <span className="text-[10px] text-slate-400 block">Desk Station:</span>
                          <span className="font-bold text-fest-amber">{contender.deskNumber || 'Desk'}</span>
                        </div>
                        <div className="p-2 rounded bg-dark-950 border border-white/5">
                          <span className="text-[10px] text-slate-400 block">Submission Time:</span>
                          <span className="font-bold text-fest-cyan">{contender.finishTimeFormatted || 'In progress'}</span>
                        </div>
                        <div className="p-2 rounded bg-dark-950 border border-white/5">
                          <span className="text-[10px] text-slate-400 block">Time Management (Auto):</span>
                          <span className="font-bold text-fest-amber">
                            {autoTimeResult.isDisqualified ? '0/10 (Late/Expired)' : `${autoTimeResult.score}/10 pts`}
                          </span>
                        </div>
                        <div className="p-2 rounded bg-dark-950 border border-white/5">
                          <span className="text-[10px] text-slate-400 block">Timing Rule Status:</span>
                          <span className="text-[11px] text-slate-300 truncate block font-sans" title={autoTimeResult.reason}>
                            {autoTimeResult.reason}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* DESK STATION SECRET INSPECTION PROMPT CONTROLLER */}
                    {(() => {
                      const isDirectiveUnlocked = Boolean(
                        verificationPrompt?.globalUnlocked ||
                        verificationPrompt?.unlockedParticipants?.[contender.participantId?.toUpperCase()] ||
                        verificationPrompt?.unlockedParticipants?.[contender.participantId]
                      );
                      const isCopied = copiedPromptId === contender.participantId;

                      return (
                        <div className={`p-4 rounded-xl border transition-all ${
                          isDirectiveUnlocked 
                            ? 'bg-emerald-950/20 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.15)]' 
                            : 'bg-dark-900 border-white/10'
                        } space-y-3`}>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                            <div className="flex items-start gap-2.5">
                              <Sparkles className={`w-4 h-4 mt-0.5 ${isDirectiveUnlocked ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
                              <div>
                                <span className="font-bold text-white block uppercase tracking-wider">
                                  Secret Inspection Directive Controller ({contender.deskNumber || 'Desk'})
                                </span>
                                <span className="text-[11px] text-slate-400 block mt-0.5">
                                  {isDirectiveUnlocked
                                    ? `● Directive Unlocked on Desk ${contender.deskNumber || ''} portal screen.`
                                    : `Locked on Desk ${contender.deskNumber || ''}. Unlock it when you visit the desk.`}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                              {/* Toggle unlock for this desk */}
                              <button
                                type="button"
                                onClick={() => toggleVerificationPromptForParticipant(contender.participantId)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                  isDirectiveUnlocked
                                    ? 'bg-rose-500/15 border border-rose-500/30 text-rose-300 hover:bg-rose-500/25'
                                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                                }`}
                              >
                                {isDirectiveUnlocked ? (
                                  <>
                                    <Lock className="w-3.5 h-3.5" />
                                    <span>Lock Prompt for Desk</span>
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="w-3.5 h-3.5" />
                                    <span>Unlock on Desk Screen</span>
                                  </>
                                )}
                              </button>

                              {/* Judge copy prompt directly to paste into Antigravity */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (navigator.clipboard) {
                                    navigator.clipboard.writeText(verificationPrompt?.directive || '');
                                    setCopiedPromptId(contender.participantId);
                                    setTimeout(() => setCopiedPromptId(null), 2500);
                                  }
                                }}
                                className="px-3 py-1.5 rounded-lg bg-fest-cyan/15 hover:bg-fest-cyan/25 border border-fest-cyan/30 text-fest-cyan text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_10px_rgba(0,229,255,0.15)]"
                              >
                                {isCopied ? (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Copied Directive!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>Copy Directive for Antigravity</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* TOP ACTION HEADER WITH EXPEL BUTTON (ALWAYS ACCESSIBLE WHETHER SUBMITTED OR NOT) */}
                    <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-dark-900 border border-white/10">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="px-2.5 py-0.5 rounded bg-fest-cyan/15 text-fest-cyan border border-fest-cyan/30 font-bold font-mono">
                          {contender.deskNumber}
                        </span>
                        <strong className="text-white">{contender.name}</strong>
                        <span className="text-slate-400">({contender.participantId})</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {!contender.isExpelled ? (
                          <button
                            type="button"
                            onClick={() => handleExpelClick(contender)}
                            className="px-3 py-1.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 hover:bg-rose-500 hover:text-white font-mono text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                            title="Expel this participant immediately for cheating / academic dishonesty"
                          >
                            <Ban className="w-3.5 h-3.5 text-rose-400" />
                            <span>Expel for Cheating</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleReinstateClick(contender)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Reinstate Contender</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* LOCK GATE: IF NOT SUBMITTED, DISABLE SCORING */}
                    {!contender.hasSubmitted ? (
                      <div className="p-6 rounded-2xl bg-dark-900 border border-amber-500/30 text-center space-y-4">
                        <Clock className="w-8 h-8 text-fest-amber mx-auto animate-pulse" />
                        <div className="space-y-1">
                          <h4 className="font-bold text-white text-sm">
                            Scoring Locked Until Participant Submits
                          </h4>
                          <p className="text-xs text-slate-400 max-w-md mx-auto">
                            Judge grading is enabled only after the participant finishes and submits their project URL from their desk. If the participant fails to submit before the battle timer expires, they will be disqualified automatically.
                          </p>
                        </div>

                        {/* Pre-Submission Expel Control for In-Progress Cheating */}
                        {!contender.isExpelled && (
                          <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-center gap-3">
                            <span className="text-xs text-rose-300 flex items-center gap-1.5 font-bold">
                              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                              <span>Caught cheating before submission?</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => handleExpelClick(contender)}
                              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_15px_rgba(244,63,94,0.4)] transition-all cursor-pointer"
                              title="Expel this participant immediately for cheating"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span>Expel for Cheating</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* OFFICIAL REDESIGNED JUDGE RUBRIC (NUMERICAL INPUT BOXES + AUTO-SAVING) */
                      <div className="space-y-5">
                        
                        {/* Header & Live Total Score Display */}
                        <div className="flex flex-wrap items-center justify-between pb-2 border-b border-white/10 gap-2">
                          <div className="flex items-center gap-2">
                            <Scale className="w-4 h-4 text-fest-amber" />
                            <span className="font-bold text-white text-xs uppercase tracking-wider">
                              Official Evaluation Rubric (Total: 100 Marks)
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            {/* Auto-Save Status Indicator */}
                            {autoSaveStatus === 'saving' && !isMarkedByOther && (
                              <span className="text-[11px] text-amber-400 flex items-center gap-1.5 animate-pulse font-mono">
                                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                                <span>Saving marks...</span>
                              </span>
                            )}
                            {autoSaveStatus === 'saved' && !isMarkedByOther && (
                              <span className="text-[11px] text-emerald-400 flex items-center gap-1.5 font-mono">
                                <Check className="w-3.5 h-3.5" />
                                <span>Auto-saved at {lastSavedTime} ✓</span>
                              </span>
                            )}
                            {!autoSaveStatus && lastSavedTime && (
                              <span className="text-[11px] text-slate-400 font-mono">
                                Last saved: {lastSavedTime}
                              </span>
                            )}

                            {/* Live Composite Total Badge */}
                            <div className="px-3 py-1 rounded-xl bg-fest-amber/20 border border-fest-amber/40 text-fest-amber font-extrabold text-sm font-mono shadow-[0_0_15px_rgba(255,183,0,0.25)]">
                              Total: {liveTotal} / 100 Marks
                            </div>
                          </div>
                        </div>

                        {/* NOTICE IF ALREADY MARKED BY ANOTHER FACULTY JUDGE (SINGLE JUDGE POLICY) */}
                        {isMarkedByOther && (
                          <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-500/40 space-y-2 text-xs font-mono">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2 text-blue-300 font-bold text-sm">
                                <Lock className="w-4 h-4 text-blue-400" />
                                <span>Evaluation Finalized by {primaryEval.judgeName}</span>
                              </div>
                              <span className="px-3 py-1 rounded-lg bg-blue-500/20 text-blue-200 border border-blue-500/40 font-bold font-mono text-xs shadow-[0_0_10px_rgba(59,130,246,0.3)]">
                                Official Mark: {primaryEval.totalScore} / 100 Pts
                              </span>
                            </div>
                            <p className="text-slate-300 text-[11px] leading-relaxed">
                              IEEE PES DIU SBC policy enforces <strong>strictly one faculty adjudicator per student</strong>. 
                              This contestant has already been evaluated by <strong>{primaryEval.judgeName}</strong> ({primaryEval.judgeEmail}) at {new Date(primaryEval.evaluatedAt).toLocaleTimeString()}.
                              The rubric values below are displayed in read-only mode to prevent duplicate marking.
                            </p>
                          </div>
                        )}

                        {/* NOTICE IF CURRENT JUDGE ALREADY MARKED */}
                        {isMarkedByMe && (
                          <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs font-mono text-emerald-300 flex items-center justify-between">
                            <span className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              <span>You evaluated this contender ({myEval.totalScore}/100 pts) at {new Date(myEval.evaluatedAt).toLocaleTimeString()}. You may adjust marks if needed.</span>
                            </span>
                          </div>
                        )}

                        {/* SECTION 1: PROMPT EFFICIENCY (50 MARKS) */}
                        <div className="p-4 rounded-xl bg-dark-900 border border-fest-cyan/30 space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <span className="font-bold text-white text-xs block">
                                1. Prompt Efficiency & Chain-of-Thought (CoT)
                              </span>
                              <span className="text-[11px] text-slate-400">
                                Check prompt deconstruction, zero hallucination guardrails, schema anchoring, and reasoning depth.
                              </span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-slate-400 text-xs">Score:</span>
                              <input
                                type="number"
                                min="0"
                                max="50"
                                step="1"
                                disabled={isMarkedByOther}
                                value={scores.promptScore}
                                onChange={(e) => handleScoreChange('promptScore', e.target.value, contender)}
                                className={`w-20 px-3 py-1.5 rounded-lg border text-white font-mono text-center font-bold text-sm focus:outline-none ${
                                  isMarkedByOther 
                                    ? 'bg-dark-900/60 border-white/10 opacity-70 cursor-not-allowed' 
                                    : 'bg-dark-950 border-fest-cyan/40 focus:border-fest-cyan'
                                }`}
                              />
                              <span className="text-fest-cyan font-bold text-xs">/ 50 Pts</span>
                            </div>
                          </div>
                        </div>

                        {/* SECTION 2: PROJECT WORKING (25 MARKS - 5 SUB-SECTIONS x 5 MARKS) */}
                        <div className="p-4 rounded-xl bg-dark-900 border border-fest-pink/30 space-y-3">
                          <div className="flex items-center justify-between pb-1 border-b border-white/10">
                            <div>
                              <span className="font-bold text-white text-xs block">
                                2. Project Working & Task Execution (25 Marks)
                              </span>
                              <span className="text-[11px] text-slate-400">
                                Evaluates whether the generated project functions properly across 5 specific components (5 marks each).
                              </span>
                            </div>
                            <span className="px-2.5 py-0.5 rounded bg-fest-pink/20 text-fest-pink border border-fest-pink/30 font-bold text-xs font-mono">
                              Subtotal: {liveProjectTotal} / 25 Pts
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
                            {/* 2a. Accuracy */}
                            <div className="p-3 rounded-lg bg-dark-950 border border-white/10 space-y-1.5">
                              <span className="text-[11px] font-bold text-slate-200 block">Accuracy of Project</span>
                              <span className="text-[10px] text-slate-400 block">Model output accuracy & constraints</span>
                              <div className="flex items-center justify-between pt-1">
                                <input
                                  type="number"
                                  min="0"
                                  max="5"
                                  step="1"
                                  disabled={isMarkedByOther}
                                  value={scores.projectAccuracy}
                                  onChange={(e) => handleScoreChange('projectAccuracy', e.target.value, contender)}
                                  className={`w-16 px-2 py-1 rounded border text-white font-mono text-center font-bold text-xs focus:outline-none ${
                                    isMarkedByOther 
                                      ? 'bg-dark-900/60 border-white/10 opacity-70 cursor-not-allowed' 
                                      : 'bg-dark-900 border border-white/20 focus:border-fest-pink'
                                  }`}
                                />
                                <span className="text-slate-400 text-xs">/ 5</span>
                              </div>
                            </div>

                            {/* 2b. Simulation Interactivity */}
                            <div className="p-3 rounded-lg bg-dark-950 border border-white/10 space-y-1.5">
                              <span className="text-[11px] font-bold text-slate-200 block">Simulation Interactivity</span>
                              <span className="text-[10px] text-slate-400 block">Real-time response & user controls</span>
                              <div className="flex items-center justify-between pt-1">
                                <input
                                  type="number"
                                  min="0"
                                  max="5"
                                  step="1"
                                  disabled={isMarkedByOther}
                                  value={scores.projectSimulation}
                                  onChange={(e) => handleScoreChange('projectSimulation', e.target.value, contender)}
                                  className={`w-16 px-2 py-1 rounded border text-white font-mono text-center font-bold text-xs focus:outline-none ${
                                    isMarkedByOther 
                                      ? 'bg-dark-900/60 border-white/10 opacity-70 cursor-not-allowed' 
                                      : 'bg-dark-900 border border-white/20 focus:border-fest-pink'
                                  }`}
                                />
                                <span className="text-slate-400 text-xs">/ 5</span>
                              </div>
                            </div>

                            {/* 2c. Live Data Monitoring */}
                            <div className="p-3 rounded-lg bg-dark-950 border border-white/10 space-y-1.5">
                              <span className="text-[11px] font-bold text-slate-200 block">Live Data Monitoring</span>
                              <span className="text-[10px] text-slate-400 block">Telemetry, gauges & visual charts</span>
                              <div className="flex items-center justify-between pt-1">
                                <input
                                  type="number"
                                  min="0"
                                  max="5"
                                  step="1"
                                  disabled={isMarkedByOther}
                                  value={scores.projectMonitoring}
                                  onChange={(e) => handleScoreChange('projectMonitoring', e.target.value, contender)}
                                  className={`w-16 px-2 py-1 rounded border text-white font-mono text-center font-bold text-xs focus:outline-none ${
                                    isMarkedByOther 
                                      ? 'bg-dark-900/60 border-white/10 opacity-70 cursor-not-allowed' 
                                      : 'bg-dark-900 border border-white/20 focus:border-fest-pink'
                                  }`}
                                />
                                <span className="text-slate-400 text-xs">/ 5</span>
                              </div>
                            </div>

                            {/* 2d. UI Usability */}
                            <div className="p-3 rounded-lg bg-dark-950 border border-white/10 space-y-1.5">
                              <span className="text-[11px] font-bold text-slate-200 block">UI Usability & Polish</span>
                              <span className="text-[10px] text-slate-400 block">Clean layout, ergonomics & UX</span>
                              <div className="flex items-center justify-between pt-1">
                                <input
                                  type="number"
                                  min="0"
                                  max="5"
                                  step="1"
                                  disabled={isMarkedByOther}
                                  value={scores.projectUsability}
                                  onChange={(e) => handleScoreChange('projectUsability', e.target.value, contender)}
                                  className={`w-16 px-2 py-1 rounded border text-white font-mono text-center font-bold text-xs focus:outline-none ${
                                    isMarkedByOther 
                                      ? 'bg-dark-900/60 border-white/10 opacity-70 cursor-not-allowed' 
                                      : 'bg-dark-900 border border-white/20 focus:border-fest-pink'
                                  }`}
                                />
                                <span className="text-slate-400 text-xs">/ 5</span>
                              </div>
                            </div>

                            {/* 2e. Component Count & Depth */}
                            <div className="p-3 rounded-lg bg-dark-950 border border-white/10 space-y-1.5">
                              <span className="text-[11px] font-bold text-slate-200 block">Component Architecture</span>
                              <span className="text-[10px] text-slate-400 block">Depth of sub-modules & completeness</span>
                              <div className="flex items-center justify-between pt-1">
                                <input
                                  type="number"
                                  min="0"
                                  max="5"
                                  step="1"
                                  disabled={isMarkedByOther}
                                  value={scores.projectComponents}
                                  onChange={(e) => handleScoreChange('projectComponents', e.target.value, contender)}
                                  className={`w-16 px-2 py-1 rounded border text-white font-mono text-center font-bold text-xs focus:outline-none ${
                                    isMarkedByOther 
                                      ? 'bg-dark-900/60 border-white/10 opacity-70 cursor-not-allowed' 
                                      : 'bg-dark-900 border border-white/20 focus:border-fest-pink'
                                  }`}
                                />
                                <span className="text-slate-400 text-xs">/ 5</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* SECTION 3: TIME MANAGEMENT (10 MARKS - AUTOMATED) */}
                        <div className="p-4 rounded-xl bg-dark-900 border border-fest-amber/30 space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white text-xs block">
                                  3. Time Management (10 Marks - Automated)
                                </span>
                                <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold uppercase">
                                  System Automated
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-400">
                                Full 10 marks if submitted within half-time (≤ 10 min). Linearly scales down afterwards. Disqualified if time expires.
                              </span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="px-3 py-1.5 rounded-lg bg-dark-950 border border-fest-amber/40 text-fest-amber font-mono font-bold text-sm">
                                {autoTimeResult.isDisqualified ? '0' : autoTimeResult.score} / 10 Pts
                              </span>
                            </div>
                          </div>
                          <div className="text-[11px] text-slate-300 bg-dark-950 p-2 rounded border border-white/5 flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-fest-amber" />
                            <span>{autoTimeResult.reason}</span>
                          </div>
                        </div>

                        {/* SECTION 4 & 5: PRESENTATION (10) & TOKEN CONSUMPTION (5) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          
                          {/* 4. Presentation & Defense */}
                          <div className="p-4 rounded-xl bg-dark-900 border border-fest-pes/30 space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-white text-xs">
                                4. Student Presentation & Defense
                              </span>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  min="0"
                                  max="10"
                                  step="1"
                                  disabled={isMarkedByOther}
                                  value={scores.presentationScore}
                                  onChange={(e) => handleScoreChange('presentationScore', e.target.value, contender)}
                                  className={`w-16 px-2 py-1 rounded border text-white font-mono text-center font-bold text-xs focus:outline-none ${
                                    isMarkedByOther 
                                      ? 'bg-dark-900/60 border-white/10 opacity-70 cursor-not-allowed' 
                                      : 'bg-dark-950 border border-fest-pes/40 focus:border-fest-pes'
                                  }`}
                                />
                                <span className="text-fest-pes font-bold text-xs">/ 10 Pts</span>
                              </div>
                            </div>
                            <p className="text-[11px] text-slate-400">
                              Student explains how their project works and defends prompt engineering choices to the judge.
                            </p>
                          </div>

                          {/* 5. Token Consumption */}
                          <div className="p-4 rounded-xl bg-dark-900 border border-purple-500/30 space-y-2">
                            <div className="flex justify-between items-center">
                              <div>
                                <span className="font-bold text-white text-xs block">
                                  5. Token Consumption Efficiency
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  Reported daily limit: <strong className="text-fest-pink">{contender.dailyLimitPercentageUsed}%</strong>
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  min="0"
                                  max="5"
                                  step="1"
                                  disabled={isMarkedByOther}
                                  value={scores.tokenScore}
                                  onChange={(e) => handleScoreChange('tokenScore', e.target.value, contender)}
                                  className={`w-16 px-2 py-1 rounded border text-white font-mono text-center font-bold text-xs focus:outline-none ${
                                    isMarkedByOther 
                                      ? 'bg-dark-900/60 border-white/10 opacity-70 cursor-not-allowed' 
                                      : 'bg-dark-950 border border-purple-500/40 focus:border-purple-400'
                                  }`}
                                />
                                <span className="text-purple-300 font-bold text-xs">/ 5 Pts</span>
                              </div>
                            </div>
                            <p className="text-[11px] text-slate-400">
                              Awarded by judge based on participant's token frugality and daily quota usage in Antigravity.
                            </p>
                          </div>

                        </div>

                        {/* SECTION 6: JUDGE NOTES & COMMENTS (AUTO-SAVED) */}
                        <div className="space-y-1.5">
                          <label className="block text-slate-300 font-bold text-xs flex items-center justify-between">
                            <span>Judge Qualitative Notes & Station Feedback (Auto-saved):</span>
                            <span className="text-slate-500 text-[10px] font-normal">Only visible to Judges & Admin</span>
                          </label>
                          <textarea
                            rows={3}
                            disabled={isMarkedByOther}
                            value={scores.notes}
                            onChange={(e) => handleScoreChange('notes', e.target.value, contender)}
                            placeholder="e.g. Excellent CoT chain reasoning; clean interactive telemetry charts; very clear explanation..."
                            className={`w-full px-3 py-2.5 rounded-lg border text-white text-xs focus:border-fest-amber placeholder-slate-500 ${
                              isMarkedByOther 
                                ? 'bg-dark-900/60 border-white/10 opacity-70 cursor-not-allowed' 
                                : 'bg-dark-950 border border-white/15'
                            }`}
                          />
                        </div>

                        {/* ACTIONS & EXPEL CHEATING BUTTON */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
                          {/* Expel Cheating Button */}
                          <button
                            type="button"
                            onClick={() => handleExpelClick(contender)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 text-xs font-bold transition-all cursor-pointer"
                            title="Expel this participant for cheating or academic dishonesty"
                          >
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                            <span>Expel for Cheating</span>
                          </button>

                          {/* Save & Close Actions */}
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setExpandedContenderId(null)}
                              className="px-3 py-2 rounded-lg bg-dark-950 border border-white/10 text-slate-400 hover:text-white text-xs transition-colors cursor-pointer"
                            >
                              Close
                            </button>
                            {isMarkedByOther ? (
                              <div className="px-4 py-2 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-300 font-bold text-xs flex items-center gap-2">
                                <Lock className="w-3.5 h-3.5 text-blue-400" />
                                <span>Already Graded by {primaryEval.judgeName} ({primaryEval.totalScore}/100)</span>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleManualSave(contender)}
                                className="px-5 py-2 rounded-lg bg-gradient-to-r from-fest-amber to-fest-pes text-dark-950 font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(255,183,0,0.35)] flex items-center gap-2 hover:opacity-95 transition-all cursor-pointer"
                              >
                                <Save className="w-4 h-4" />
                                <span>Save Marks ({liveTotal}/100)</span>
                              </button>
                            )}
                          </div>
                        </div>

                      </div>
                    )}

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
