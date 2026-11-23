import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { 
  initFirebase, 
  subscribeToCloudState, 
  pushStateToCloud, 
  getStoredFirebaseConfig, 
  saveStoredFirebaseConfig 
} from '../lib/firebase';
import { playCountdownTick, playStartHorn, playFinishFanfare, playTimesUpAlert } from '../lib/sound';
import { 
  evaluateTotalScore, 
  DEFAULT_TOKEN_BUDGET, 
  DEFAULT_BATTLE_DURATION,
  calculateTokenScore,
  calculateTimeScore,
  calculateAutomatedTimeScore,
  calculateOfficialJudgeTotal
} from '../lib/scoringCalculator';
import { INITIAL_ROSTER } from '../data/initialParticipants';

const BattleContext = createContext(null);

const STORAGE_KEY = 'pb_local_state_v3';
const BROADCAST_CHANNEL_NAME = 'prompt_battle_broadcast_v3';
export const ADMIN_EMAIL = 'pes.ieee@diu.edu.bd';
export const ADMIN_PASSWORD = 'PesDiuSbc2026';

const INITIAL_DURATION = 1200; // 20 minutes default

// Safe array helper to prevent Firebase Realtime Database object-conversion crashes
export function toSafeArray(val, fallback = []) {
  if (Array.isArray(val)) return val;
  if (val && typeof val === 'object') {
    return Object.values(val);
  }
  return fallback;
}

// Official Secret Adjudication Inspection / Verification Directive Prompt
// Standardized by IEEE PES DIU SBC for Judge AI session inspection
export const DEFAULT_VERIFICATION_PROMPT = {
  id: 'judge-audit-prompt-2026',
  title: 'Judge AI Audit & Token Consumption Inspection Directive',
  directive: `[SYSTEM AUDIT & EVALUATION DIRECTIVE — IEEE PES DIU SBC ADJUDICATION]
Analyze the entire conversation session above and provide a strict, transparent evaluation summary for the adjudication panel:
1. Token & Context Accounting: Detail the approximate prompt tokens, completion tokens, and total context usage consumed during this task.
2. Reasoning Decomposition: Summarize the key Chain-of-Thought (CoT) reasoning steps and architecture decisions generated.
3. Constraint & Schema Validation: Confirm whether all mandatory constraints (zero hallucination, valid JSON output, schema keys) were strictly fulfilled.
4. Model Efficiency: Rate the prompt frugality and economy score (out of 100).
Output this summary concisely in clean markdown with a structured audit table.`,
  unlockedParticipants: {}, // [participantId]: true | false
  globalUnlocked: false,
  status: 'ready',
  lastUpdated: Date.now(),
};

export const DEFAULT_POLL = {
  id: 'poll-1',
  question: 'Which AI Model Architecture excels the most at complex logical prompt decomposition?',
  type: 'mcq', // 'voting' or 'mcq'
  status: 'active', // 'active' | 'closed'
  published: false,
  displayMode: 'percentage', // 'percentage' | 'leaderboard'
  options: [
    { id: 'opt-1', text: 'Mixture of Experts (MoE) with CoT', isCorrect: true, votes: 0 },
    { id: 'opt-2', text: 'Dense Monolithic 7B Parameter Model', isCorrect: false, votes: 0 },
    { id: 'opt-3', text: 'Unquantized Recurrent Baseline', isCorrect: false, votes: 0 },
    { id: 'opt-4', text: 'Standard Zero-Shot Feedforward', isCorrect: false, votes: 0 }
  ],
  votes: {},
};

export const DEFAULT_PROBLEM_STATEMENT = {
  id: 'problem-pb-2026',
  title: 'Autonomous Smart Grid Load Forecasting & Dispatch Optimizer',
  track: 'Production Prompt Engineering & Chain-of-Thought (CoT)',
  status: 'hidden', // 'hidden' | 'released'
  releasedAt: null,
  scenario: `You are the lead AI Prompt Engineer for an intelligent Smart Microgrid operated under IEEE Power & Energy Society (PES) guidelines for EEE FEST 2026.

Your challenge is to architect a production-ready System Prompt and structured Chain-of-Thought (CoT) reasoning pipeline in Google Antigravity. The AI system ingests real-time intermittent solar, wind generation telemetry, fluctuating industrial/domestic load curves, and battery storage levels. 

The model must synthesize a 24-hour predictive dispatch plan that eliminates blackouts, respects voltage stability margins, and outputs strict, machine-readable JSON without explanatory chat filler or conversational preambles.`,
  objective: `Develop a comprehensive system prompt and instruction framework that forces the AI model to:
1. Deconstruct multi-variable dispatch constraints step-by-step using explicit Chain-of-Thought (CoT).
2. Calculate exact megawatt (MW) allocation commands across Solar PV, Wind Turbines, Battery Storage, and Grid Reserves.
3. Strictly validate output structure against the required JSON schema.
4. Maximize token efficiency under Google Antigravity daily limit quotas (scored out of 15 pts).`,
  constraints: [
    'Zero Output Hallucination: The model must return ONLY valid, parsable JSON matching the required schema.',
    'Token Budget Efficiency: Optimize prompt brevity to conserve daily Antigravity limit (15 pts).',
    'Adversarial Injection Defense: Prompt must resist conflicting user inputs attempting to bypass grid safety thresholds.',
    'Deterministic Output: Pin system persona and formatting anchors to eliminate variance across consecutive runs.',
    'Self-Correction Guardrails: Include explicit failure-handling protocols if input data has missing sensory telemetry.'
  ]
};

export const DEFAULT_CONTENDERS = INITIAL_ROSTER;

export const DEFAULT_OFFICIAL_JUDGES = [
  {
    id: 'judge-1',
    name: 'Dr. Srimanti Roy Choudhury',
    email: 'srimanti.eee@diu.edu.bd',
    password: 'Prompt_Battle_SRC_2026',
    judgeNumber: 1,
    registeredAt: 1732320000000,
  },
  {
    id: 'judge-2',
    name: 'Md. Wahiduzzaman',
    email: 'wahiduzzaman.eee@diu.edu.bd',
    password: 'Prompt_Battle_MW_2026',
    judgeNumber: 2,
    registeredAt: 1732320000000,
  },
  {
    id: 'judge-3',
    name: 'Anik Biswas',
    email: 'anik.eee@diu.edu.bd',
    password: 'Prompt_Battle_AB_2026',
    judgeNumber: 3,
    registeredAt: 1732320000000,
  },
  {
    id: 'judge-4',
    name: 'Sayeed Hossain Sayor',
    email: 'sayor.eee@diu.edu.bd',
    password: 'Prompt_Battle_SHS_2026',
    judgeNumber: 4,
    registeredAt: 1732320000000,
  },
];

export const DEFAULT_STATE = {
  activeArena: 'battle', // 'battle' | 'poll'
  timer: {
    duration: INITIAL_DURATION,
    remaining: INITIAL_DURATION,
    status: 'idle',
    startedAt: null,
    endsAt: null,
  },
  published: false,
  participants: [],
  joinedParticipants: {}, // [participantId]: { id, name, teamName, arena, lastSeen, tabSwitches }
  registeredContenders: INITIAL_ROSTER,
  judges: DEFAULT_OFFICIAL_JUDGES, // 4 official adjudicators + chief judge
  tokenBudget: DEFAULT_TOKEN_BUDGET,

  // Live Problem Statement State
  problemStatement: DEFAULT_PROBLEM_STATEMENT,

  // Live Poll State
  poll: DEFAULT_POLL,

  // Secret Judge Inspection / Verification Directive Prompt
  // Unlocked customly per participant when Judge visits their desk
  verificationPrompt: DEFAULT_VERIFICATION_PROMPT,

  lastUpdated: Date.now(),
};

// Deep state merger ensuring zero undefined properties from cloud/storage
export function sanitizeState(raw) {
  if (!raw || typeof raw !== 'object') return DEFAULT_STATE;

  const rawPoll = raw.poll || {};
  const pollOptions = toSafeArray(rawPoll.options, DEFAULT_POLL.options);

  const rawVP = raw.verificationPrompt || {};
  const unlockedMap = (rawVP.unlockedParticipants && typeof rawVP.unlockedParticipants === 'object')
    ? rawVP.unlockedParticipants
    : {};

  const now = Date.now();
  const rawJoined = (raw.joinedParticipants && typeof raw.joinedParticipants === 'object') ? raw.joinedParticipants : {};
  const cleanJoined = {};
  Object.entries(rawJoined).forEach(([id, p]) => {
    // Only retain active presence within the last 2 minutes
    if (p && p.lastSeen && (now - p.lastSeen < 120000)) {
      cleanJoined[id] = p;
    }
  });

  const rawRoster = toSafeArray(raw.registeredContenders, []);
  const hasOfficialRoster = rawRoster.length === 64 && rawRoster.some(c => c.couponCode && String(c.couponCode).toUpperCase().startsWith('PBC'));
  const effectiveRoster = hasOfficialRoster ? rawRoster : INITIAL_ROSTER;

  const rawJudges = toSafeArray(raw.judges, []);
  const hasOfficialJudges = rawJudges.some(j => j.email && j.email.includes('@diu.edu.bd'));
  const effectiveJudges = (rawJudges.length === 4 && hasOfficialJudges) ? rawJudges : DEFAULT_OFFICIAL_JUDGES;

  return {
    ...DEFAULT_STATE,
    ...raw,
    activeArena: raw.activeArena === 'poll' ? 'poll' : 'battle',
    timer: {
      ...DEFAULT_STATE.timer,
      ...(raw.timer || {}),
    },
    joinedParticipants: cleanJoined,
    poll: {
      ...DEFAULT_POLL,
      ...rawPoll,
      displayMode: rawPoll.displayMode || 'percentage',
      options: pollOptions.length > 0 ? pollOptions : DEFAULT_POLL.options,
      votes: rawPoll.votes || {},
      status: rawPoll.status || 'active',
      type: rawPoll.type || 'mcq',
    },
    verificationPrompt: {
      ...DEFAULT_VERIFICATION_PROMPT,
      ...rawVP,
      directive: rawVP.directive || DEFAULT_VERIFICATION_PROMPT.directive,
      unlockedParticipants: unlockedMap,
      globalUnlocked: Boolean(rawVP.globalUnlocked),
    },
    problemStatement: {
      ...DEFAULT_PROBLEM_STATEMENT,
      ...(raw.problemStatement || {}),
      constraints: toSafeArray(raw.problemStatement?.constraints, DEFAULT_PROBLEM_STATEMENT.constraints),
    },
    participants: toSafeArray(raw.participants, []),
    registeredContenders: effectiveRoster,
    judges: effectiveJudges,
    tokenBudget: Number(raw.tokenBudget) || DEFAULT_TOKEN_BUDGET,
    published: Boolean(raw.published),
    lastUpdated: raw.lastUpdated || Date.now(),
  };
}

export function getBasePath() {
  if (typeof window === 'undefined') return '';
  return window.location.pathname.startsWith('/prompt-battle-2026') ? '/prompt-battle-2026' : '';
}

export function resolveViewFromUrl() {
  if (typeof window === 'undefined') return 'submit';

  const validViews = ['presentation', 'admin', 'submit', 'judge'];

  // 1. Check pathname: /submit, /admin, /judge, /presentation, or /prompt-battle-2026/submit
  try {
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const lastPart = (pathParts[pathParts.length - 1] || '').toLowerCase();
    if (validViews.includes(lastPart)) {
      return lastPart;
    }
    if (lastPart === 'login' || lastPart === 'participant') {
      return 'submit';
    }
  } catch (e) {}

  // 2. Check search parameter: ?view=admin or ?v=admin
  try {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view') || params.get('v');
    if (viewParam && validViews.includes(viewParam.toLowerCase())) {
      return viewParam.toLowerCase();
    }
    if (viewParam && (viewParam.toLowerCase() === 'login' || viewParam.toLowerCase() === 'participant')) {
      return 'submit';
    }
  } catch (e) {}

  // 3. Fallback for legacy hash bookmarks (strip # and convert)
  if (window.location.hash) {
    const cleanHash = window.location.hash.replace(/^[#/]+/, '').replace(/\/+$/, '').toLowerCase();
    if (validViews.includes(cleanHash)) {
      return cleanHash;
    }
    if (cleanHash === 'login' || cleanHash === 'participant') {
      return 'submit';
    }
  }

  // DEFAULT HOME PAGE: Login Page (Participant Portal /submit)
  return 'submit';
}

export function BattleProvider({ children }) {
  const [battleState, setBattleState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return sanitizeState(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Failed to load local state:', e);
    }
    return DEFAULT_STATE;
  });

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return sessionStorage.getItem('pb_admin_auth') === 'true';
  });

  const [activeView, setActiveView] = useState(() => resolveViewFromUrl());

  const [firebaseStatus, setFirebaseStatus] = useState('connecting');
  const [firebaseError, setFirebaseError] = useState(null);

  const broadcastRef = useRef(null);
  const battleStateRef = useRef(battleState);
  battleStateRef.current = battleState;

  const syncStateRef = useRef(null);

  // Sync state to local storage and broadcast to other tabs & cloud
  const syncState = useCallback((newState, shouldPushCloud = true) => {
    const cleanState = sanitizeState(newState);
    setBattleState(cleanState);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanState));
    } catch (e) {
      console.warn(e);
    }

    if (broadcastRef.current) {
      try {
        broadcastRef.current.postMessage({ type: 'STATE_UPDATE', payload: cleanState });
      } catch (err) {
        console.warn('Broadcast error:', err);
      }
    }

    if (shouldPushCloud) {
      pushStateToCloud(cleanState).catch((err) => console.warn('Cloud sync error:', err));
    }
  }, []);

  syncStateRef.current = syncState;

  // Initialize BroadcastChannel & Storage Event Listeners
  useEffect(() => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      broadcastRef.current = channel;

      channel.onmessage = (event) => {
        if (event.data?.type === 'STATE_UPDATE' && event.data.payload) {
          const sanitized = sanitizeState(event.data.payload);
          setBattleState(sanitized);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
          } catch (e) {
            console.warn(e);
          }
        }
      };
    }

    const handleStorageEvent = (e) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setBattleState(sanitizeState(parsed));
        } catch (err) {
          console.warn(err);
        }
      }
    };

    window.addEventListener('storage', handleStorageEvent);

    return () => {
      if (broadcastRef.current) broadcastRef.current.close();
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, []);

  // Initialize Firebase Cloud sync
  useEffect(() => {
    const config = getStoredFirebaseConfig();
    const initRes = initFirebase(config);
    if (!initRes.success) {
      setFirebaseStatus('error');
      setFirebaseError(initRes.error);
      return;
    }

    setFirebaseStatus('connected');
    const unsubscribe = subscribeToCloudState(
      (cloudData) => {
        if (cloudData && cloudData.lastUpdated) {
          setBattleState((prev) => {
            if (!prev.lastUpdated || cloudData.lastUpdated > prev.lastUpdated) {
              const sanitized = sanitizeState(cloudData);
              try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
              } catch (e) {
                console.warn(e);
              }
              return sanitized;
            }
            return prev;
          });
        }
      },
      (err) => {
        setFirebaseStatus('error');
        setFirebaseError(err.message || 'Firestore/RTDB connection issue');
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Active Timer Tick Loop for Battle (Stable interval that does not thash dependencies)
  useEffect(() => {
    let intervalId = null;

    if (battleState.timer.status === 'running' && battleState.timer.endsAt) {
      intervalId = setInterval(() => {
        const now = Date.now();
        const diffMs = battleState.timer.endsAt - now;
        const remainingSec = Math.max(0, Math.ceil(diffMs / 1000));

        if (remainingSec <= 0) {
          clearInterval(intervalId);
          playTimesUpAlert();
          if (syncStateRef.current) {
            syncStateRef.current({
              ...battleStateRef.current,
              timer: {
                ...battleStateRef.current.timer,
                remaining: 0,
                status: 'finished',
              },
              lastUpdated: Date.now(),
            });
          }
        } else {
          if (remainingSec <= 10) {
            playCountdownTick();
          }

          setBattleState((prev) => {
            if (prev.timer.remaining === remainingSec) return prev;
            return {
              ...prev,
              timer: {
                ...prev.timer,
                remaining: remainingSec,
              },
            };
          });
        }
      }, 250);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [battleState.timer.status, battleState.timer.endsAt]);

  const switchView = useCallback((newView) => {
    if (!['presentation', 'admin', 'submit', 'judge'].includes(newView)) return;
    setActiveView(newView);

    // Clean Path Routing without #
    const basePath = getBasePath();
    const targetPath = newView === 'presentation' ? `${basePath}/` : `${basePath}/${newView}`;

    if (window.location.pathname !== targetPath || window.location.hash) {
      window.history.pushState(null, '', targetPath);
    }
  }, []);

  // Upgrade any legacy # hash in URL to clean path on mount
  useEffect(() => {
    if (window.location.hash) {
      const cleanHash = window.location.hash.replace(/^[#/]+/, '').replace(/\/+$/, '').toLowerCase();
      if (['presentation', 'admin', 'submit', 'judge'].includes(cleanHash)) {
        const basePath = getBasePath();
        const targetPath = cleanHash === 'presentation' ? `${basePath}/` : `${basePath}/${cleanHash}`;
        window.history.replaceState(null, '', targetPath + window.location.search);
      }
    }
  }, []);

  // Listen for popstate and keyboard shortcuts
  useEffect(() => {
    const handleUrlChange = () => {
      const detected = resolveViewFromUrl();
      setActiveView(detected);
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);

    // Adjudicator shortcuts: Alt+A opens Admin, Alt+P opens Presentation, Alt+S opens Contender, Alt+J opens Judge
    const handleKeyDown = (e) => {
      if ((e.altKey && (e.key === 'a' || e.key === 'A')) || 
          (e.ctrlKey && e.shiftKey && (e.key === 'a' || e.key === 'A'))) {
        e.preventDefault();
        switchView('admin');
      } else if ((e.altKey && (e.key === 'p' || e.key === 'P')) || 
                 (e.ctrlKey && e.shiftKey && (e.key === 'p' || e.key === 'P'))) {
        e.preventDefault();
        switchView('presentation');
      } else if ((e.altKey && (e.key === 's' || e.key === 'S')) || 
                 (e.ctrlKey && e.shiftKey && (e.key === 's' || e.key === 'S'))) {
        e.preventDefault();
        switchView('submit');
      } else if ((e.altKey && (e.key === 'j' || e.key === 'J')) || 
                 (e.ctrlKey && e.shiftKey && (e.key === 'j' || e.key === 'J'))) {
        e.preventDefault();
        switchView('judge');
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [switchView]);

  // ADMIN CONTROL: Master Arena Switcher
  // When Admin switches arena, it broadcasts to all phones & presentation screens
  const switchArena = useCallback((arena) => {
    const now = Date.now();
    const newState = {
      ...battleState,
      activeArena: arena,
      lastUpdated: now,
    };
    syncState(newState);
  }, [battleState, syncState]);

  // --- BATTLE ACTIONS ---
  const startTimer = useCallback((customDurationSec = null) => {
    const currentState = battleStateRef.current;
    const rawDuration = (typeof customDurationSec === 'number' && !isNaN(customDurationSec) && customDurationSec > 0)
      ? customDurationSec
      : (Number(currentState.timer?.duration) || 1200);
    const duration = Math.max(10, Math.round(rawDuration));
    const now = Date.now();
    const endsAt = now + duration * 1000;
    playStartHorn();
    syncState({
      ...currentState,
      activeArena: 'battle',
      timer: {
        duration,
        remaining: duration,
        status: 'running',
        startedAt: now,
        endsAt,
      },
      lastUpdated: now,
    });
  }, [syncState]);

  const pauseTimer = useCallback(() => {
    const now = Date.now();
    const currentState = battleStateRef.current;
    const currentTimer = currentState.timer || {};
    let currentRemaining = Number(currentTimer.remaining) || Number(currentTimer.duration) || 1200;
    if (currentTimer.endsAt) {
      currentRemaining = Math.max(0, Math.ceil((currentTimer.endsAt - now) / 1000));
    }
    syncState({
      ...currentState,
      timer: {
        ...currentTimer,
        remaining: currentRemaining,
        status: 'paused',
        endsAt: null,
      },
      lastUpdated: now,
    });
  }, [syncState]);

  const resumeTimer = useCallback(() => {
    const now = Date.now();
    const currentState = battleStateRef.current;
    const currentTimer = currentState.timer || {};
    const totalDuration = Number(currentTimer.duration) || 1200;
    let remaining = Number(currentTimer.remaining);
    if (isNaN(remaining) || remaining <= 0) {
      remaining = totalDuration;
    }
    const endsAt = now + remaining * 1000;
    playStartHorn();
    syncState({
      ...currentState,
      timer: {
        ...currentTimer,
        remaining,
        status: 'running',
        startedAt: currentTimer.startedAt || now,
        endsAt,
      },
      lastUpdated: now,
    });
  }, [syncState]);

  const resetTimer = useCallback((newDurationSec = null) => {
    const currentState = battleStateRef.current;
    const raw = (typeof newDurationSec === 'number' && !isNaN(newDurationSec) && newDurationSec > 0)
      ? newDurationSec
      : (Number(currentState.timer?.duration) || 1200);
    const duration = Math.max(10, Math.round(raw));
    const now = Date.now();
    syncState({
      ...currentState,
      timer: {
        duration,
        remaining: duration,
        status: 'idle',
        startedAt: null,
        endsAt: null,
      },
      lastUpdated: now,
    });
  }, [syncState]);

  const submitParticipantWork = useCallback(({ participantId = '', name, teamName = '', deskNumber = '', notes = '', tokensUsed = 0, workUrl = '' }) => {
    const now = Date.now();
    let elapsedSec = 0;
    if (battleState.timer.startedAt) {
      elapsedSec = Math.max(1, Math.floor((now - battleState.timer.startedAt) / 1000));
    }
    const minutes = Math.floor(elapsedSec / 60);
    const seconds = elapsedSec % 60;
    const finishTimeFormatted = `${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;

    const duration = Number(battleState.timer.duration) || DEFAULT_BATTLE_DURATION;
    const tokens = Number(tokensUsed) || 0;

    // Automated time management score calculation (10 pts max):
    // <= half duration -> 10/10 pts full marks.
    // > half duration -> linear scale down to 0.
    // Late submission past duration -> 0 pts & automatic disqualification.
    const isLate = (elapsedSec > duration) || (battleState.timer.status === 'finished');
    const autoTime = calculateAutomatedTimeScore(elapsedSec, duration, true);
    const isDisqualified = isLate || autoTime.isDisqualified;

    const cleanParticipantId = (participantId || '').trim().toUpperCase() || `PB-${Math.floor(100 + Math.random() * 900)}`;
    const matchedRoster = (battleState.registeredContenders || []).find(
      (c) => c.participantId?.toUpperCase() === cleanParticipantId
    );
    const resolvedDesk = (deskNumber || matchedRoster?.deskNumber || 'Main Floor').trim();

    const newParticipant = {
      id: `p-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      participantId: cleanParticipantId,
      name: name.trim(),
      teamName: teamName.trim() || matchedRoster?.teamName || 'Independent Contender',
      deskNumber: resolvedDesk,
      submittedAt: now,
      finishSeconds: elapsedSec,
      finishTimeFormatted,
      notes: notes.trim(),
      workUrl: (workUrl || '').trim(),
      submittedUrl: (workUrl || '').trim(),
      hasSubmitted: true,
      tokensUsed: tokens,
      dailyLimitPercentageUsed: tokens,
      timeScore: isDisqualified ? 0 : autoTime.score,
      timeScoreDetails: autoTime.reason,
      promptScore: 0,
      projectAccuracy: 0,
      projectSimulation: 0,
      projectMonitoring: 0,
      projectUsability: 0,
      projectComponents: 0,
      projectWorkingTotal: 0,
      presentationScore: 0,
      tokenScore: 0,
      totalScore: isDisqualified ? 0 : autoTime.score,
      isDisqualified: isDisqualified,
      status: isDisqualified ? 'Disqualified (Time Expired)' : 'Submitted',
      disqualificationReason: isDisqualified ? 'Failed to submit within allocated battle time limit' : null,
      judgeMarks: {},
      tabSwitches: 0,
    };

    if (!isDisqualified) {
      playFinishFanfare();
    }
    const currentList = toSafeArray(battleState.participants, []);
    syncState({
      ...battleState,
      participants: [newParticipant, ...currentList.filter(p => p.participantId?.toUpperCase() !== cleanParticipantId)],
      lastUpdated: now,
    });
    return newParticipant;
  }, [battleState, syncState]);

  const updateParticipantMarks = useCallback((id, updates) => {
    const now = Date.now();
    const currentList = toSafeArray(battleState.participants, []);
    const budget = Number(battleState.tokenBudget) || DEFAULT_TOKEN_BUDGET;
    const duration = Number(battleState.timer.duration) || DEFAULT_BATTLE_DURATION;

    const updated = currentList.map((p) => {
      if (p.id !== id && p.participantId !== id) return p;
      const merged = { ...p, ...updates };

      const scoring = evaluateTotalScore({
        tokensUsed: Number(merged.tokensUsed) || 0,
        tokenBudget: budget,
        finishSeconds: Number(merged.finishSeconds) || 0,
        totalDurationSec: duration,
        objectiveScore: Number(merged.objectiveScore) || 0,
        finishStatus: merged.finishStatus || 'Partially Fulfilled',
        presentationScore: Number(merged.presentationScore) || 0,
        noveltyScore: Number(merged.noveltyScore) || 0,
      });

      merged.tokenScore = updates.tokenScore !== undefined ? Number(updates.tokenScore) : scoring.tokenScore;
      merged.tokenPercentageUsed = scoring.tokenPercentageUsed;
      merged.timeScore = updates.timeScore !== undefined ? Number(updates.timeScore) : scoring.timeScore;
      merged.timePercentageUsed = scoring.timePercentageUsed;
      merged.totalScore = updates.totalScore !== undefined ? Number(updates.totalScore) : scoring.totalScore;
      return merged;
    });

    syncState({
      ...battleState,
      participants: updated,
      lastUpdated: now,
    });
  }, [battleState, syncState]);

  const addManualParticipant = useCallback((participantData) => {
    const now = Date.now();
    const budget = Number(battleState.tokenBudget) || DEFAULT_TOKEN_BUDGET;
    const duration = Number(battleState.timer.duration) || DEFAULT_BATTLE_DURATION;
    const cleanId = (participantData.participantId || '').trim().toUpperCase() || `PB-${Math.floor(100 + Math.random() * 900)}`;

    const scoring = evaluateTotalScore({
      tokensUsed: Number(participantData.tokensUsed) || 0,
      tokenBudget: budget,
      finishSeconds: Number(participantData.finishSeconds) || 0,
      totalDurationSec: duration,
      objectiveScore: Number(participantData.objectiveScore) || 0,
      finishStatus: participantData.finishStatus || 'Fully Completed',
      presentationScore: Number(participantData.presentationScore) || 0,
      noveltyScore: Number(participantData.noveltyScore) || 0,
    });

    const newParticipant = {
      id: `p-manual-${Date.now()}`,
      participantId: cleanId,
      name: participantData.name || 'New Participant',
      teamName: participantData.teamName || 'Solo',
      submittedAt: now,
      finishSeconds: Number(participantData.finishSeconds) || 0,
      finishTimeFormatted: participantData.finishTimeFormatted || 'Manual Entry',
      notes: participantData.notes || '',
      workUrl: participantData.workUrl || '',
      tokensUsed: Number(participantData.tokensUsed) || 0,
      tokenScore: scoring.tokenScore,
      tokenPercentageUsed: scoring.tokenPercentageUsed,
      timeScore: scoring.timeScore,
      timePercentageUsed: scoring.timePercentageUsed,
      objectiveScore: Number(participantData.objectiveScore) || 0,
      finishStatus: participantData.finishStatus || 'Fully Completed',
      finishStatusNotes: participantData.finishStatusNotes || '',
      presentationScore: Number(participantData.presentationScore) || 0,
      noveltyScore: Number(participantData.noveltyScore) || 0,
      totalScore: participantData.totalScore !== undefined ? Number(participantData.totalScore) : scoring.totalScore,
      tabSwitches: 0,
    };
    const currentList = toSafeArray(battleState.participants, []);
    syncState({
      ...battleState,
      participants: [newParticipant, ...currentList.filter(p => p.participantId !== cleanId)],
      lastUpdated: now,
    });
  }, [battleState, syncState]);

  const removeParticipant = useCallback((id) => {
    const now = Date.now();
    const currentList = toSafeArray(battleState.participants, []);
    syncState({
      ...battleState,
      participants: currentList.filter((p) => p.id !== id),
      lastUpdated: now,
    });
  }, [battleState, syncState]);

  const togglePublishLeaderboard = useCallback((shouldPublish) => {
    const now = Date.now();
    syncState({
      ...battleState,
      published: shouldPublish,
      lastUpdated: now,
    });
  }, [battleState, syncState]);

  // --- PROBLEM STATEMENT ACTIONS ---
  const releaseProblemStatement = useCallback(() => {
    const now = Date.now();
    const currentState = battleStateRef.current;
    const currentPS = currentState.problemStatement || DEFAULT_PROBLEM_STATEMENT;
    const updated = {
      ...currentState,
      problemStatement: {
        ...currentPS,
        status: 'released',
        releasedAt: now,
      },
      lastUpdated: now,
    };
    syncState(updated, true);
    playStartHorn();
  }, [syncState]);

  const hideProblemStatement = useCallback(() => {
    const now = Date.now();
    const currentState = battleStateRef.current;
    const currentPS = currentState.problemStatement || DEFAULT_PROBLEM_STATEMENT;
    const updated = {
      ...currentState,
      problemStatement: {
        ...currentPS,
        status: 'hidden',
        releasedAt: null,
      },
      lastUpdated: now,
    };
    syncState(updated, true);
  }, [syncState]);

  const publishProblemStatement = useCallback(() => {
    releaseProblemStatement();
  }, [releaseProblemStatement]);

  const unpublishProblemStatement = useCallback(() => {
    hideProblemStatement();
  }, [hideProblemStatement]);

  const updateProblemStatement = useCallback((updates) => {
    const now = Date.now();
    const updated = {
      ...battleState,
      problemStatement: {
        ...(battleState.problemStatement || DEFAULT_PROBLEM_STATEMENT),
        ...updates,
      },
      lastUpdated: now,
    };
    syncState(updated);
  }, [battleState, syncState]);

  const resetProblemStatement = useCallback(() => {
    const now = Date.now();
    const updated = {
      ...battleState,
      problemStatement: {
        ...DEFAULT_PROBLEM_STATEMENT,
        status: 'hidden',
        releasedAt: null,
      },
      lastUpdated: now,
    };
    syncState(updated);
  }, [battleState, syncState]);

  // --- SECRET JUDGE VERIFICATION PROMPT ACTIONS ---
  // Judge or Admin can unlock this standardized directive customly for an individual participant desk
  const unlockVerificationPromptForParticipant = useCallback((participantId) => {
    const cleanId = (participantId || '').trim().toUpperCase();
    if (!cleanId) return;
    const currentVP = battleState.verificationPrompt || DEFAULT_VERIFICATION_PROMPT;
    const updated = {
      ...battleState,
      verificationPrompt: {
        ...currentVP,
        unlockedParticipants: {
          ...(currentVP.unlockedParticipants || {}),
          [cleanId]: true,
        },
        lastUpdated: Date.now(),
      },
      lastUpdated: Date.now(),
    };
    syncState(updated, true);
  }, [battleState, syncState]);

  const lockVerificationPromptForParticipant = useCallback((participantId) => {
    const cleanId = (participantId || '').trim().toUpperCase();
    if (!cleanId) return;
    const currentVP = battleState.verificationPrompt || DEFAULT_VERIFICATION_PROMPT;
    const updated = {
      ...battleState,
      verificationPrompt: {
        ...currentVP,
        unlockedParticipants: {
          ...(currentVP.unlockedParticipants || {}),
          [cleanId]: false,
        },
        lastUpdated: Date.now(),
      },
      lastUpdated: Date.now(),
    };
    syncState(updated, true);
  }, [battleState, syncState]);

  const toggleVerificationPromptForParticipant = useCallback((participantId) => {
    const cleanId = (participantId || '').trim().toUpperCase();
    if (!cleanId) return;
    const currentVP = battleState.verificationPrompt || DEFAULT_VERIFICATION_PROMPT;
    const isUnlocked = Boolean(currentVP.unlockedParticipants?.[cleanId]);
    const updated = {
      ...battleState,
      verificationPrompt: {
        ...currentVP,
        unlockedParticipants: {
          ...(currentVP.unlockedParticipants || {}),
          [cleanId]: !isUnlocked,
        },
        lastUpdated: Date.now(),
      },
      lastUpdated: Date.now(),
    };
    syncState(updated, true);
  }, [battleState, syncState]);

  const updateVerificationPromptDirective = useCallback((newDirectiveOrObj) => {
    const currentVP = battleState.verificationPrompt || DEFAULT_VERIFICATION_PROMPT;
    const updates = typeof newDirectiveOrObj === 'object' && newDirectiveOrObj !== null
      ? newDirectiveOrObj
      : { directive: (newDirectiveOrObj || '').trim() };
    const updated = {
      ...battleState,
      verificationPrompt: {
        ...currentVP,
        ...updates,
        lastUpdated: Date.now(),
      },
      lastUpdated: Date.now(),
    };
    syncState(updated, true);
  }, [battleState, syncState]);

  const toggleGlobalVerificationPrompt = useCallback((shouldUnlock) => {
    const currentVP = battleState.verificationPrompt || DEFAULT_VERIFICATION_PROMPT;
    const nextVal = typeof shouldUnlock === 'boolean' ? shouldUnlock : !currentVP.globalUnlocked;
    const updated = {
      ...battleState,
      verificationPrompt: {
        ...currentVP,
        globalUnlocked: nextVal,
        lastUpdated: Date.now(),
      },
      lastUpdated: Date.now(),
    };
    syncState(updated, true);
  }, [battleState, syncState]);

  const resetVerificationPrompt = useCallback(() => {
    const updated = {
      ...battleState,
      verificationPrompt: DEFAULT_VERIFICATION_PROMPT,
      lastUpdated: Date.now(),
    };
    syncState(updated, true);
  }, [battleState, syncState]);

  // --- LIVE POLL ACTIONS ---
  // When Admin creates a poll, it automatically switches ALL screens to Poll view!
  const createPoll = useCallback(({ question, type, options }) => {
    const now = Date.now();
    const formattedOptions = options.map((opt, idx) => ({
      id: `opt-${idx + 1}`,
      text: (opt.text || '').trim(),
      isCorrect: Boolean(opt.isCorrect),
      votes: 0,
    }));

    const newPoll = {
      id: `poll-${now}`,
      question: (question || '').trim(),
      type: type || 'mcq',
      status: 'active',
      published: false,
      options: formattedOptions,
      votes: {},
    };

    playStartHorn();

    syncState({
      ...battleState,
      activeArena: 'poll', // Automatically switch auditorium and participant screens!
      poll: newPoll,
      lastUpdated: now,
    });
  }, [battleState, syncState]);

  const submitVote = useCallback(({ participantId, participantName, teamName, optionId, timeTakenSec }) => {
    const now = Date.now();
    const currentPoll = battleState.poll || DEFAULT_POLL;
    if (currentPoll.status === 'closed') {
      return { success: false, error: 'Voting is currently closed.' };
    }

    const optionsList = toSafeArray(currentPoll.options, DEFAULT_POLL.options);
    const chosenOption = optionsList.find((o) => o.id === optionId);
    const isCorrect = Boolean(chosenOption?.isCorrect);

    // Speed & accuracy score calculation for MCQ (Kahoot style)
    const timeSec = Number(timeTakenSec) || 4;
    const score = isCorrect ? Math.max(100, Math.round((1 - Math.min(1, timeSec / 25) / 2) * 1000)) : 0;

    const currentVotes = { ...(currentPoll.votes || {}) };
    const existingVote = currentVotes[participantId] || {};

    currentVotes[participantId] = {
      optionId,
      name: participantName || existingVote.name || 'Contender',
      teamName: teamName || existingVote.teamName || 'Solo',
      timestamp: now,
      timeTakenSec: timeSec,
      isCorrect,
      score,
      tabSwitches: existingVote.tabSwitches || 0,
    };

    const updatedOptions = optionsList.map((opt) => {
      const voteCount = Object.values(currentVotes).filter((v) => v.optionId === opt.id).length;
      return { ...opt, votes: voteCount };
    });

    playFinishFanfare();

    syncState({
      ...battleState,
      poll: {
        ...currentPoll,
        options: updatedOptions,
        votes: currentVotes,
      },
      lastUpdated: now,
    });

    return { success: true };
  }, [battleState, syncState]);

  const setPollStatus = useCallback((status) => {
    const now = Date.now();
    syncState({
      ...battleState,
      poll: {
        ...battleState.poll,
        status,
      },
      lastUpdated: now,
    });
  }, [battleState, syncState]);

  const setPollDisplayMode = useCallback((displayMode) => {
    const now = Date.now();
    syncState({
      ...battleState,
      poll: {
        ...battleState.poll,
        displayMode: displayMode || 'percentage',
      },
      lastUpdated: now,
    });
  }, [battleState, syncState]);

  const publishPollResults = useCallback((shouldPublish) => {
    const now = Date.now();
    syncState({
      ...battleState,
      poll: {
        ...battleState.poll,
        published: shouldPublish,
      },
      lastUpdated: now,
    });
  }, [battleState, syncState]);

  const registerPresence = useCallback(({ participantId, name, teamName, arena }) => {
    if (!participantId) return;
    setBattleState((prev) => {
      const currentJoined = { ...(prev.joinedParticipants || {}) };
      const existing = currentJoined[participantId] || {};
      const updated = {
        id: participantId,
        name: name || existing.name || 'Contender',
        teamName: teamName || existing.teamName || 'Solo',
        arena: arena || prev.activeArena || 'battle',
        lastSeen: Date.now(),
        tabSwitches: existing.tabSwitches || 0,
      };
      currentJoined[participantId] = updated;

      const newState = {
        ...prev,
        joinedParticipants: currentJoined,
        lastUpdated: Date.now(),
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      } catch (e) {}
      if (broadcastRef.current) {
        try {
          broadcastRef.current.postMessage({ type: 'STATE_UPDATE', payload: newState });
        } catch (e) {}
      }
      pushStateToCloud(newState).catch(() => {});
      return newState;
    });
  }, []);

  const reportTabSwitch = useCallback(({ participantId, name, teamName, arena }) => {
    if (!participantId) return;
    setBattleState((prev) => {
      const currentJoined = { ...(prev.joinedParticipants || {}) };
      const existing = currentJoined[participantId] || {
        id: participantId,
        name: name || 'Contender',
        teamName: teamName || 'Solo',
        tabSwitches: 0,
      };
      const switchCount = (existing.tabSwitches || 0) + 1;
      currentJoined[participantId] = {
        ...existing,
        name: name || existing.name,
        teamName: teamName || existing.teamName,
        arena: arena || prev.activeArena,
        tabSwitches: switchCount,
        lastSeen: Date.now(),
      };

      // Also update in participants list
      const updatedParticipants = toSafeArray(prev.participants, []).map((p) => {
        if (p.id === participantId || (p.name && p.name.toLowerCase() === (name || '').toLowerCase())) {
          return { ...p, tabSwitches: switchCount };
        }
        return p;
      });

      // Also update in poll.votes
      const currentVotes = { ...(prev.poll?.votes || {}) };
      if (currentVotes[participantId]) {
        currentVotes[participantId] = {
          ...currentVotes[participantId],
          tabSwitches: switchCount,
        };
      }

      const newState = {
        ...prev,
        joinedParticipants: currentJoined,
        participants: updatedParticipants,
        poll: {
          ...prev.poll,
          votes: currentVotes,
        },
        lastUpdated: Date.now(),
      };

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      } catch (e) {}
      if (broadcastRef.current) {
        try {
          broadcastRef.current.postMessage({ type: 'STATE_UPDATE', payload: newState });
        } catch (e) {}
      }
      pushStateToCloud(newState).catch(() => {});
      return newState;
    });
  }, []);

  const resetPoll = useCallback(() => {
    const now = Date.now();
    syncState({
      ...battleState,
      poll: DEFAULT_POLL,
      lastUpdated: now,
    });
  }, [battleState, syncState]);

  const updatePoll = useCallback((updatedData) => {
    const now = Date.now();
    const currentPoll = battleState.poll || DEFAULT_POLL;
    const formattedOptions = (updatedData.options || currentPoll.options || []).map((opt, idx) => ({
      id: opt.id || `opt-${idx + 1}`,
      text: (opt.text || '').trim(),
      isCorrect: Boolean(opt.isCorrect),
      votes: opt.votes || 0,
    }));

    syncState({
      ...battleState,
      poll: {
        ...currentPoll,
        question: (updatedData.question !== undefined ? updatedData.question : currentPoll.question).trim(),
        type: updatedData.type || currentPoll.type,
        options: formattedOptions,
      },
      lastUpdated: now,
    });
  }, [battleState, syncState]);

  const deletePoll = useCallback(() => {
    const now = Date.now();
    syncState({
      ...battleState,
      poll: {
        ...DEFAULT_POLL,
        id: `poll-${now}`,
        question: 'New Live Poll Pending...',
        type: 'mcq',
        status: 'closed',
        published: false,
        options: [],
        votes: {},
      },
      lastUpdated: now,
    });
  }, [battleState, syncState]);

  // Contender Roster Management
  const addRegisteredContender = useCallback(({ participantId, name, teamName = '', deskNumber = '' }) => {
    const now = Date.now();
    const currentList = toSafeArray(battleState.registeredContenders, DEFAULT_CONTENDERS);
    const cleanId = (participantId || '').trim().toUpperCase();
    if (!cleanId) return;

    const newEntry = {
      participantId: cleanId,
      name: (name || '').trim(),
      teamName: (teamName || '').trim() || 'Solo Contender',
      deskNumber: (deskNumber || '').trim() || 'Main Floor',
    };

    const updated = [newEntry, ...currentList.filter((c) => c.participantId?.toUpperCase() !== cleanId)];

    syncState({
      ...battleState,
      registeredContenders: updated,
      lastUpdated: now,
    });
  }, [battleState, syncState]);

  const bulkAddRegisteredContenders = useCallback((newList) => {
    const now = Date.now();
    const currentList = toSafeArray(battleState.registeredContenders, DEFAULT_CONTENDERS);
    const map = new Map();
    currentList.forEach((c) => map.set(c.participantId?.toUpperCase(), c));

    (newList || []).forEach((c) => {
      const id = (c.participantId || '').trim().toUpperCase();
      if (id) {
        map.set(id, {
          participantId: id,
          name: (c.name || '').trim() || `Contender ${id}`,
          teamName: (c.teamName || '').trim() || 'Solo Contender',
          deskNumber: (c.deskNumber || '').trim() || 'Main Floor',
        });
      }
    });

    syncState({
      ...battleState,
      registeredContenders: Array.from(map.values()),
      lastUpdated: now,
    });
  }, [battleState, syncState]);

  const updateRegisteredContender = useCallback((participantId, updates) => {
    const now = Date.now();
    const cleanId = (participantId || '').trim().toUpperCase();
    const currentList = toSafeArray(battleState.registeredContenders, DEFAULT_CONTENDERS);
    const updated = currentList.map((c) => {
      if (c.participantId?.toUpperCase() === cleanId) {
        return { ...c, ...updates, participantId: cleanId };
      }
      return c;
    });

    syncState({
      ...battleState,
      registeredContenders: updated,
      lastUpdated: now,
    });
  }, [battleState, syncState]);

  const deleteRegisteredContender = useCallback((participantId) => {
    const now = Date.now();
    const cleanId = (participantId || '').trim().toUpperCase();
    const currentList = toSafeArray(battleState.registeredContenders, DEFAULT_CONTENDERS);
    syncState({
      ...battleState,
      registeredContenders: currentList.filter((c) => c.participantId?.toUpperCase() !== cleanId),
      lastUpdated: now,
    });
  }, [battleState, syncState]);

  const setTokenBudget = useCallback((budget) => {
    const now = Date.now();
    syncState({
      ...battleState,
      tokenBudget: Math.max(100, Number(budget) || DEFAULT_TOKEN_BUDGET),
      lastUpdated: now,
    });
  }, [battleState, syncState]);

  // Judge Session State for current browser tab
  const [currentJudge, setCurrentJudge] = useState(() => {
    try {
      const saved = localStorage.getItem('pb_judge_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Admin Authentication: checks cloud admin or fallback pes.ieee@diu.edu.bd / PesDiuSbc2026
  const authenticateAdmin = useCallback((enteredEmail, enteredPassword) => {
    const cleanEmail = (enteredEmail || '').trim().toLowerCase();
    const cleanPass = (enteredPassword || '').trim();

    const cloudAdminEmail = (battleState.admin?.email || ADMIN_EMAIL).toLowerCase();
    const cloudAdminPass = battleState.admin?.password || ADMIN_PASSWORD;

    // Support both dual-field (email + password) and single-password fallback
    if (
      (cleanEmail === cloudAdminEmail && cleanPass === cloudAdminPass) ||
      (cleanEmail === ADMIN_EMAIL.toLowerCase() && cleanPass === ADMIN_PASSWORD) ||
      ((cleanPass === cloudAdminPass || cleanPass === ADMIN_PASSWORD) && !cleanEmail) ||
      ((cleanEmail === cloudAdminPass || cleanEmail === ADMIN_PASSWORD) && !cleanPass)
    ) {
      setIsAdminAuthenticated(true);
      sessionStorage.setItem('pb_admin_auth', 'true');
      sessionStorage.setItem('pb_admin_email', cleanEmail || cloudAdminEmail);
      return { success: true };
    }
    return { success: false, error: `Incorrect credentials. Admin Email: ${cloudAdminEmail}` };
  }, [battleState.admin]);

  const logoutAdmin = useCallback(() => {
    setIsAdminAuthenticated(false);
    sessionStorage.removeItem('pb_admin_auth');
    sessionStorage.removeItem('pb_admin_email');
  }, []);

  // Contender (User) Authentication: Email (Student or Personal) + Coupon Code (Passcode/Password)
  const authenticateContender = useCallback((enteredEmail, enteredPasscode) => {
    const cleanEmail = (enteredEmail || '').trim().toLowerCase();
    const cleanPass = (enteredPasscode || '').trim();

    if (!cleanEmail || !cleanPass) {
      return { success: false, error: 'Please enter both your registered Email address and your Coupon Code password.' };
    }

    const currentList = toSafeArray(battleState.registeredContenders, INITIAL_ROSTER);
    const match = currentList.find((c) => {
      const cStudentMail = (c.studentMail || '').trim().toLowerCase();
      const cPersonalMail = (c.personalMail || '').trim().toLowerCase();
      const cEmail = (c.email || c.mail || '').trim().toLowerCase();
      const cId = (c.participantId || c.studentId || '').trim().toLowerCase();

      // Check if entered identifier matches Student Mail, Personal Mail, Email, or Student ID
      const identifierMatches = (
        (cStudentMail && cStudentMail === cleanEmail) ||
        (cPersonalMail && cPersonalMail === cleanEmail) ||
        (cEmail && cEmail === cleanEmail) ||
        (cId && cId === cleanEmail)
      );

      if (!identifierMatches) return false;

      // Check if password matches Coupon Code, Passcode, or Password (case-insensitive for PBC codes)
      const cCoupon = String(c.couponCode || c.passcode || c.password || '').trim();
      const passMatches = (
        cCoupon.toUpperCase() === cleanPass.toUpperCase() ||
        cCoupon === cleanPass
      );

      return passMatches;
    });

    if (match) {
      return { success: true, contender: match };
    }

    return { 
      success: false, 
      error: 'Invalid Email or Coupon Code. Please verify your registered email and the unique coupon code (e.g. PBC001) from IEEE PES DIU SBC.' 
    };
  }, [battleState.registeredContenders]);

  // Judge Registration (Max 4 Judges using their Gmail and Password)
  const registerJudge = useCallback(({ name, email, password }) => {
    const cleanName = (name || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    if (!cleanName) return { success: false, error: 'Please enter your Full Name.' };
    if (!cleanEmail || !cleanEmail.includes('@')) return { success: false, error: 'Please enter a valid Gmail / Email address.' };
    if (!cleanPass || cleanPass.length < 4) return { success: false, error: 'Password must be at least 4 characters long.' };

    const currentJudges = toSafeArray(battleState.judges, []);
    if (currentJudges.length >= 4) {
      return { success: false, error: 'All 4 Judge positions are already registered. Please log into your existing account.' };
    }

    if (currentJudges.some(j => j.email?.toLowerCase() === cleanEmail)) {
      return { success: false, error: 'This Gmail address is already registered as an adjudicator. Please log in.' };
    }

    const judgeNumber = currentJudges.length + 1;
    const newJudge = {
      id: `judge-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: cleanName,
      email: cleanEmail,
      password: cleanPass,
      judgeNumber,
      registeredAt: Date.now(),
    };

    const updated = [...currentJudges, newJudge];
    syncState({
      ...battleState,
      judges: updated,
      lastUpdated: Date.now(),
    });

    setCurrentJudge(newJudge);
    try {
      localStorage.setItem('pb_judge_session', JSON.stringify(newJudge));
    } catch (e) {}

    return { success: true, judge: newJudge };
  }, [battleState, syncState]);

  // Judge Authentication (Login with Gmail & Password)
  const authenticateJudge = useCallback((enteredEmail, enteredPassword) => {
    const cleanEmail = (enteredEmail || '').trim().toLowerCase();
    const cleanPass = (enteredPassword || '').trim();

    if (!cleanEmail || !cleanPass) {
      return { success: false, error: 'Please enter both your Gmail and password.' };
    }

    // Support Master IEEE PES credential login as Chief Adjudicator
    if (cleanEmail === ADMIN_EMAIL.toLowerCase() && cleanPass === ADMIN_PASSWORD) {
      const masterJudge = {
        id: 'judge-master-pes',
        name: 'Chief Adjudicator (IEEE PES)',
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        judgeNumber: 1,
        registeredAt: Date.now(),
      };
      setCurrentJudge(masterJudge);
      try {
        localStorage.setItem('pb_judge_session', JSON.stringify(masterJudge));
      } catch (e) {}
      return { success: true, judge: masterJudge };
    }

    const currentJudges = toSafeArray(battleState.judges, []);
    const match = currentJudges.find(j => j.email?.toLowerCase() === cleanEmail && j.password === cleanPass);

    if (match) {
      setCurrentJudge(match);
      try {
        localStorage.setItem('pb_judge_session', JSON.stringify(match));
      } catch (e) {}
      return { success: true, judge: match };
    }

    return { success: false, error: 'Invalid Gmail or password. If you have not created your judge account yet, please sign up.' };
  }, [battleState.judges]);

  const logoutJudge = useCallback(() => {
    setCurrentJudge(null);
    try {
      localStorage.removeItem('pb_judge_session');
    } catch (e) {}
  }, []);

  const deleteJudge = useCallback((judgeId) => {
    const currentJudges = toSafeArray(battleState.judges, []);
    const filtered = currentJudges.filter(j => j.id !== judgeId);
    const reindexed = filtered.map((j, idx) => ({ ...j, judgeNumber: idx + 1 }));
    syncState({
      ...battleState,
      judges: reindexed,
      lastUpdated: Date.now(),
    });
    if (currentJudge?.id === judgeId) {
      logoutJudge();
    }
  }, [battleState, currentJudge, syncState, logoutJudge]);

  // Judge Evaluation Submission: Calculates per-judge marks and aggregate average score
  // Rubric: Prompt (50), Project Working (25: 5+5+5+5+5), Time Management (10 auto), Presentation (10), Token Consumption (5) = 100 Pts
  const submitJudgeEvaluation = useCallback(({ participantId, judgeId, marks }) => {
    const now = Date.now();
    const cleanId = (participantId || '').trim().toUpperCase();
    const currentParticipants = toSafeArray(battleState.participants, []);

    let existing = currentParticipants.find(p => (p.participantId?.toUpperCase() === cleanId || p.id === cleanId));

    if (!existing) {
      const reg = (battleState.registeredContenders || []).find(c => c.participantId?.toUpperCase() === cleanId);
      existing = {
        id: cleanId,
        participantId: cleanId,
        name: reg?.name || `Contender ${cleanId}`,
        teamName: reg?.teamName || 'Solo Contender',
        deskNumber: reg?.deskNumber || 'Desk 01',
        email: reg?.email || '',
        finishTimeFormatted: 'Not submitted',
        finishSeconds: 0,
        tokensUsed: 0,
        dailyLimitPercentageUsed: 0,
        judgeMarks: {},
        totalScore: 0,
        status: 'Evaluated',
      };
    }

    const currentJudgeMarks = existing.judgeMarks || {};
    const existingEvaluations = Object.values(currentJudgeMarks);
    
    // Strict single-judge policy: only one teacher is allowed to mark per student
    const otherJudge = existingEvaluations.find(j => j.judgeId !== judgeId);
    if (otherJudge) {
      console.warn(`[Evaluation Lock] Blocked duplicate evaluation. Student already marked by ${otherJudge.judgeName}`);
      return {
        success: false,
        error: `This contender has already been evaluated by ${otherJudge.judgeName}. Only one teacher is allowed to mark per student.`,
      };
    }

    const judgeInfo = (battleState.judges || []).find(j => j.id === judgeId) || currentJudge;

    // Calculate official total score
    const evaluatedTotal = calculateOfficialJudgeTotal({
      promptScore: marks.promptScore ?? marks.objectiveScore ?? 0,
      projectAccuracy: marks.projectAccuracy ?? 0,
      projectSimulation: marks.projectSimulation ?? 0,
      projectMonitoring: marks.projectMonitoring ?? 0,
      projectUsability: marks.projectUsability ?? 0,
      projectComponents: marks.projectComponents ?? 0,
      timeScore: marks.timeScore ?? existing.timeScore ?? 0,
      presentationScore: marks.presentationScore ?? 0,
      tokenScore: marks.tokenScore ?? 0,
    });

    const isParticipantExpelled = Boolean(existing.isExpelled || marks.isExpelled);
    const isParticipantDisqualified = Boolean(existing.isDisqualified || marks.isDisqualified);
    const finalJudgeTotal = (isParticipantExpelled || isParticipantDisqualified) ? 0 : evaluatedTotal.totalScore;

    const newJudgeEntry = {
      judgeId,
      judgeName: judgeInfo?.name || `Judge ${judgeInfo?.judgeNumber || 1}`,
      judgeNumber: judgeInfo?.judgeNumber || 1,
      judgeEmail: judgeInfo?.email || '',
      promptScore: evaluatedTotal.promptScore,
      objectiveScore: evaluatedTotal.promptScore, // backward compatibility
      projectAccuracy: evaluatedTotal.projectAccuracy,
      projectSimulation: evaluatedTotal.projectSimulation,
      projectMonitoring: evaluatedTotal.projectMonitoring,
      projectUsability: evaluatedTotal.projectUsability,
      projectComponents: evaluatedTotal.projectComponents,
      projectWorkingTotal: evaluatedTotal.projectWorkingTotal,
      presentationScore: evaluatedTotal.presentationScore,
      tokenScore: evaluatedTotal.tokenScore,
      timeScore: evaluatedTotal.timeScore,
      totalScore: finalJudgeTotal,
      notes: (marks.notes || '').trim(),
      evaluatedAt: now,
    };

    const updatedJudgeMarks = {
      ...currentJudgeMarks,
      [judgeId]: newJudgeEntry,
    };

    // Calculate composite / average score across all judges who marked this contender
    const judgeScoresList = Object.values(updatedJudgeMarks);
    const avgTotalScore = (isParticipantExpelled || isParticipantDisqualified)
      ? 0
      : (judgeScoresList.length > 0
          ? Math.round(judgeScoresList.reduce((sum, j) => sum + (Number(j.totalScore) || 0), 0) / judgeScoresList.length)
          : finalJudgeTotal);

    const updatedParticipant = {
      ...existing,
      judgeMarks: updatedJudgeMarks,
      markedByJudgeName: newJudgeEntry.judgeName,
      markedByJudgeId: judgeId,
      markedByJudgeEmail: newJudgeEntry.judgeEmail,
      totalScore: avgTotalScore,
      promptScore: newJudgeEntry.promptScore,
      objectiveScore: newJudgeEntry.promptScore,
      projectWorkingTotal: newJudgeEntry.projectWorkingTotal,
      presentationScore: newJudgeEntry.presentationScore,
      evaluatedByJudgesCount: judgeScoresList.length,
      lastEvaluatedAt: now,
    };

    const existsInList = currentParticipants.some(p => (p.participantId?.toUpperCase() === cleanId || p.id === cleanId));
    const updatedList = existsInList
      ? currentParticipants.map(p => (p.participantId?.toUpperCase() === cleanId || p.id === cleanId) ? updatedParticipant : p)
      : [...currentParticipants, updatedParticipant];

    syncState({
      ...battleState,
      participants: updatedList,
      lastUpdated: now,
    });

    return { success: true, participant: updatedParticipant };
  }, [battleState, currentJudge, syncState]);

  // Expel Participant for Cheating / Academic Dishonesty
  const expelParticipant = useCallback(({ participantId, reason = 'Academic Dishonesty / Cheating', judgeName = 'Judge' }) => {
    const now = Date.now();
    const cleanId = (participantId || '').trim().toUpperCase();
    const currentParticipants = toSafeArray(battleState.participants, []);
    let existing = currentParticipants.find(p => p.participantId?.toUpperCase() === cleanId || p.id === cleanId);

    if (!existing) {
      const reg = (battleState.registeredContenders || []).find(c => c.participantId?.toUpperCase() === cleanId);
      existing = {
        id: cleanId,
        participantId: cleanId,
        name: reg?.name || `Contender ${cleanId}`,
        teamName: reg?.teamName || 'Solo Contender',
        deskNumber: reg?.deskNumber || 'Desk 01',
        email: reg?.email || '',
        finishTimeFormatted: 'N/A',
        finishSeconds: 0,
        tokensUsed: 0,
        dailyLimitPercentageUsed: 0,
        judgeMarks: {},
      };
    }

    const updatedRecord = {
      ...existing,
      isDisqualified: true,
      isExpelled: true,
      status: 'Expelled (Cheating)',
      disqualificationReason: `Expelled by ${judgeName}: ${reason}`,
      totalScore: 0,
      expelledAt: now,
      lastEvaluatedAt: now,
    };

    const exists = currentParticipants.some(p => p.participantId?.toUpperCase() === cleanId || p.id === cleanId);
    const updatedList = exists
      ? currentParticipants.map(p => (p.participantId?.toUpperCase() === cleanId || p.id === cleanId) ? updatedRecord : p)
      : [...currentParticipants, updatedRecord];

    syncState({
      ...battleState,
      participants: updatedList,
      lastUpdated: now,
    });
    return { success: true, participant: updatedRecord };
  }, [battleState, syncState]);

  // Reinstate Participant in case of accidental expel
  const reinstateParticipant = useCallback((participantId) => {
    const now = Date.now();
    const cleanId = (participantId || '').trim().toUpperCase();
    const currentParticipants = toSafeArray(battleState.participants, []);
    const existing = currentParticipants.find(p => p.participantId?.toUpperCase() === cleanId || p.id === cleanId);
    if (!existing) return;

    const marksList = Object.values(existing.judgeMarks || {});
    const avgScore = marksList.length > 0
      ? Math.round(marksList.reduce((sum, j) => sum + (Number(j.totalScore) || 0), 0) / marksList.length)
      : (existing.timeScore || 0);

    const reinstated = {
      ...existing,
      isDisqualified: false,
      isExpelled: false,
      status: existing.submittedUrl ? 'Submitted' : 'Registered',
      disqualificationReason: null,
      totalScore: avgScore,
      reinstatedAt: now,
    };

    const updatedList = currentParticipants.map(p => (p.participantId?.toUpperCase() === cleanId || p.id === cleanId) ? reinstated : p);
    syncState({
      ...battleState,
      participants: updatedList,
      lastUpdated: now,
    });
  }, [battleState, syncState]);

  const configureFirebase = useCallback((configObj) => {
    saveStoredFirebaseConfig(configObj);
    const res = initFirebase(configObj);
    if (res.success) {
      setFirebaseStatus('connected');
      setFirebaseError(null);
      pushStateToCloud(battleState);
      return { success: true };
    } else {
      setFirebaseStatus('error');
      setFirebaseError(res.error);
      return { success: false, error: res.error };
    }
  }, [battleState]);

  const resetAllData = useCallback(() => {
    const now = Date.now();
    syncState({
      ...battleState,
      participants: [],
      joinedParticipants: {},
      // Strictly preserve all 64 official registered contenders and their assigned desks
      registeredContenders: INITIAL_ROSTER,
      judges: battleState.judges && battleState.judges.length > 0 ? battleState.judges : DEFAULT_OFFICIAL_JUDGES,
      timer: {
        duration: INITIAL_DURATION,
        remaining: INITIAL_DURATION,
        status: 'idle',
        startedAt: null,
        endsAt: null,
      },
      published: false,
      poll: {
        ...(battleState.poll || DEFAULT_POLL),
        votes: {},
      },
      verificationPrompt: {
        ...(battleState.verificationPrompt || DEFAULT_VERIFICATION_PROMPT),
        globalUnlocked: false,
        unlockedParticipants: {},
      },
      lastUpdated: now,
    });
  }, [battleState, syncState]);

  const clearAllPresence = useCallback(() => {
    syncState({
      ...battleState,
      joinedParticipants: {},
      lastUpdated: Date.now(),
    });
  }, [battleState, syncState]);

  const safePoll = battleState.poll || DEFAULT_POLL;
  const safeVP = battleState.verificationPrompt || DEFAULT_VERIFICATION_PROMPT;

  const value = {
    battleState,
    activeArena: battleState.activeArena === 'poll' ? 'poll' : 'battle',
    timer: battleState.timer,
    participants: toSafeArray(battleState.participants, []),
    registeredContenders: toSafeArray(battleState.registeredContenders, []),
    tokenBudget: Number(battleState.tokenBudget) || DEFAULT_TOKEN_BUDGET,
    published: battleState.published,
    joinedParticipants: battleState.joinedParticipants || {},
    // Real-time Active Connected Participants (Heartbeat within last 60 seconds)
    totalJoinedCount: Object.values(battleState.joinedParticipants || {}).filter(
      (p) => p && p.lastSeen && (Date.now() - p.lastSeen < 60000)
    ).length,
    poll: {
      ...safePoll,
      displayMode: safePoll.displayMode || 'percentage',
      options: toSafeArray(safePoll.options, DEFAULT_POLL.options),
      votes: safePoll.votes || {},
    },
    verificationPrompt: safeVP,
    isAdminAuthenticated,
    activeView,
    firebaseStatus,
    firebaseError,
    switchView,
    switchArena,

    // Contender Auth
    authenticateContender,

    // Judges
    judges: toSafeArray(battleState.judges, []),
    currentJudge,
    registerJudge,
    authenticateJudge,
    logoutJudge,
    deleteJudge,
    submitJudgeEvaluation,
    expelParticipant,
    reinstateParticipant,

    // Presence & Anti-Cheat
    registerPresence,
    reportTabSwitch,
    clearAllPresence,
    addRegisteredContender,
    bulkAddRegisteredContenders,
    updateRegisteredContender,
    deleteRegisteredContender,
    setTokenBudget,

    // Battle
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    submitParticipantWork,
    updateParticipantMarks,
    addManualParticipant,
    removeParticipant,
    togglePublishLeaderboard,

    // Problem Statement Actions
    problemStatement: battleState.problemStatement || DEFAULT_PROBLEM_STATEMENT,
    releaseProblemStatement,
    hideProblemStatement,
    publishProblemStatement,
    unpublishProblemStatement,
    updateProblemStatement,
    resetProblemStatement,

    // Secret Judge Verification Prompt Actions (Customly unlocked per participant)
    unlockVerificationPromptForParticipant,
    lockVerificationPromptForParticipant,
    toggleVerificationPromptForParticipant,
    updateVerificationPromptDirective,
    toggleGlobalVerificationPrompt,
    resetVerificationPrompt,

    // Poll
    createPoll,
    updatePoll,
    deletePoll,
    submitVote,
    setPollStatus,
    setPollDisplayMode,
    publishPollResults,
    resetPoll,

    // Admin & Sync
    authenticateAdmin,
    logoutAdmin,
    configureFirebase,
    resetAllData,
  };

  return (
    <BattleContext.Provider value={value}>
      {children}
    </BattleContext.Provider>
  );
}

export function useBattle() {
  const context = useContext(BattleContext);
  if (!context) {
    throw new Error('useBattle must be used within a BattleProvider');
  }
  return context;
}
