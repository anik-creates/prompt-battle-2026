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
  calculateTimeScore
} from '../lib/scoringCalculator';

const BattleContext = createContext(null);

const STORAGE_KEY = 'pb_local_state_v3';
const BROADCAST_CHANNEL_NAME = 'prompt_battle_broadcast_v3';
const ADMIN_PASSWORD = 'eeefestadmin';

const INITIAL_DURATION = 1200; // 20 minutes default

// Safe array helper to prevent Firebase Realtime Database object-conversion crashes
export function toSafeArray(val, fallback = []) {
  if (Array.isArray(val)) return val;
  if (val && typeof val === 'object') {
    return Object.values(val);
  }
  return fallback;
}

// Pre-built AI Prompt Engineering questions for the Kahoot-Style Quiz
export const DEFAULT_QUIZ_QUESTIONS = [
  {
    id: 'q-1',
    question: 'Which prompting technique explicitly asks the model to break reasoning into intermediate steps before concluding?',
    options: [
      'Chain-of-Thought (CoT)',
      'Zero-Shot Direct Directive',
      'Few-Shot Classification',
      'Temperature Scaling Prompting'
    ],
    correctIndex: 0,
    timeLimit: 20,
  },
  {
    id: 'q-2',
    question: 'In prompt optimization, what is the primary consequence of exceeding the context window limit?',
    options: [
      'Model raises API error or truncates earlier tokens',
      'Model automatically increases token generation speed',
      'Temperature drops to 0.0 automatically',
      'System prompt permanently overrides user instructions'
    ],
    correctIndex: 0,
    timeLimit: 20,
  },
  {
    id: 'q-3',
    question: 'Which method is most effective at preventing adversarial "Prompt Injection" attacks?',
    options: [
      'Strict input delimitation & systemic guardrail schemas',
      'Setting temperature to 1.0',
      'Asking the model "please be secure"',
      'Removing system instructions completely'
    ],
    correctIndex: 0,
    timeLimit: 20,
  },
  {
    id: 'q-4',
    question: 'What role does "Persona Anchoring" play in system prompts?',
    options: [
      'Establishes domain tone, vocabulary, and behavioral constraints',
      'Directly reduces GPU compute memory',
      'Eliminates all token generation latency',
      'Forces model to always answer in JSON format'
    ],
    correctIndex: 0,
    timeLimit: 20,
  },
  {
    id: 'q-5',
    question: 'Organized by IEEE PES DIU SBC for EEE FEST 2026, what is this grand championship named?',
    options: [
      'Prompt Battle 2026',
      'Robo Wars 2026',
      'Circuits & Chips Hack',
      'Code Clash 2026'
    ],
    correctIndex: 0,
    timeLimit: 15,
  }
];

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

export const DEFAULT_CONTENDERS = [
  { participantId: 'PB-101', name: 'Tanvir Hossain', teamName: 'DIU Pioneers', deskNumber: 'Desk 01' },
  { participantId: 'PB-102', name: 'Anik Sarker', teamName: 'PES Titans', deskNumber: 'Desk 02' },
  { participantId: 'PB-103', name: 'Sumaiya Akter', teamName: 'Cyber Sparks', deskNumber: 'Desk 03' },
  { participantId: 'PB-104', name: 'Rakib Hasan', teamName: 'Neural Circuit', deskNumber: 'Desk 04' },
  { participantId: 'PB-105', name: 'Farhan Kabir', teamName: 'Vector Core', deskNumber: 'Desk 05' },
];

export const DEFAULT_STATE = {
  activeArena: 'battle', // 'battle' | 'poll' | 'quiz'
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
  registeredContenders: DEFAULT_CONTENDERS,
  tokenBudget: DEFAULT_TOKEN_BUDGET,

  // Live Poll State
  poll: DEFAULT_POLL,

  // Kahoot Live Quiz State
  quiz: {
    id: 'quiz-main',
    title: 'Prompt Battle 2026 Kahoot Arena',
    status: 'idle', // 'idle' | 'in_progress' | 'question_ended' | 'finished'
    currentQuestionIndex: 0,
    questionEndsAt: null,
    published: false,
    questions: DEFAULT_QUIZ_QUESTIONS,
    submissions: {},
  },

  lastUpdated: Date.now(),
};

// Deep state merger ensuring zero undefined properties from cloud/storage
export function sanitizeState(raw) {
  if (!raw || typeof raw !== 'object') return DEFAULT_STATE;

  const rawPoll = raw.poll || {};
  const pollOptions = toSafeArray(rawPoll.options, DEFAULT_POLL.options);

  const rawQuiz = raw.quiz || {};
  const quizQuestions = toSafeArray(rawQuiz.questions, DEFAULT_QUIZ_QUESTIONS);

  return {
    ...DEFAULT_STATE,
    ...raw,
    activeArena: raw.activeArena || 'battle',
    timer: {
      ...DEFAULT_STATE.timer,
      ...(raw.timer || {}),
    },
    joinedParticipants: (raw.joinedParticipants && typeof raw.joinedParticipants === 'object') ? raw.joinedParticipants : {},
    poll: {
      ...DEFAULT_POLL,
      ...rawPoll,
      displayMode: rawPoll.displayMode || 'percentage',
      options: pollOptions.length > 0 ? pollOptions : DEFAULT_POLL.options,
      votes: rawPoll.votes || {},
      status: rawPoll.status || 'active',
      type: rawPoll.type || 'mcq',
    },
    quiz: {
      ...DEFAULT_STATE.quiz,
      ...rawQuiz,
      questions: quizQuestions.length > 0 ? quizQuestions : DEFAULT_QUIZ_QUESTIONS,
      submissions: rawQuiz.submissions || {},
      status: rawQuiz.status || 'idle',
    },
    participants: toSafeArray(raw.participants, []),
    registeredContenders: toSafeArray(raw.registeredContenders, DEFAULT_CONTENDERS),
    tokenBudget: Number(raw.tokenBudget) || DEFAULT_TOKEN_BUDGET,
    published: Boolean(raw.published),
    lastUpdated: raw.lastUpdated || Date.now(),
  };
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

  const [activeView, setActiveView] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    if (viewParam && ['presentation', 'admin', 'submit'].includes(viewParam)) {
      return viewParam;
    }
    const hash = window.location.hash.replace('#', '');
    if (['presentation', 'admin', 'submit'].includes(hash)) {
      return hash;
    }
    return 'presentation';
  });

  const [firebaseStatus, setFirebaseStatus] = useState('connecting');
  const [firebaseError, setFirebaseError] = useState(null);

  const broadcastRef = useRef(null);

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

  // Active Timer Tick Loop for Battle
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
          syncState({
            ...battleState,
            timer: {
              ...battleState.timer,
              remaining: 0,
              status: 'finished',
            },
            lastUpdated: Date.now(),
          });
        } else {
          if (remainingSec <= 10 && remainingSec !== battleState.timer.remaining) {
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
  }, [battleState.timer.status, battleState.timer.endsAt, battleState, syncState]);

  // Active Quiz Question Countdown Tick
  useEffect(() => {
    let quizInterval = null;

    if (battleState.quiz?.status === 'in_progress' && battleState.quiz.questionEndsAt) {
      quizInterval = setInterval(() => {
        const now = Date.now();
        const diffMs = battleState.quiz.questionEndsAt - now;

        if (diffMs <= 0) {
          clearInterval(quizInterval);
          playTimesUpAlert();
          syncState({
            ...battleState,
            quiz: {
              ...battleState.quiz,
              status: 'question_ended',
              questionEndsAt: null,
            },
            lastUpdated: Date.now(),
          });
        } else if (diffMs <= 5000 && Math.floor(diffMs / 1000) !== Math.floor((diffMs + 250) / 1000)) {
          playCountdownTick();
        }
      }, 250);
    }

    return () => {
      if (quizInterval) clearInterval(quizInterval);
    };
  }, [battleState.quiz?.status, battleState.quiz?.questionEndsAt, battleState, syncState]);

  const switchView = useCallback((newView) => {
    setActiveView(newView);
    window.location.hash = `#${newView}`;
  }, []);

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
    const duration = customDurationSec !== null ? customDurationSec : battleState.timer.duration;
    const now = Date.now();
    const endsAt = now + duration * 1000;
    playStartHorn();
    syncState({
      ...battleState,
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
  }, [battleState, syncState]);

  const pauseTimer = useCallback(() => {
    const now = Date.now();
    let currentRemaining = battleState.timer.remaining;
    if (battleState.timer.endsAt) {
      currentRemaining = Math.max(0, Math.ceil((battleState.timer.endsAt - now) / 1000));
    }
    syncState({
      ...battleState,
      timer: {
        ...battleState.timer,
        remaining: currentRemaining,
        status: 'paused',
        endsAt: null,
      },
      lastUpdated: now,
    });
  }, [battleState, syncState]);

  const resumeTimer = useCallback(() => {
    const now = Date.now();
    const remaining = battleState.timer.remaining > 0 ? battleState.timer.remaining : battleState.timer.duration;
    const endsAt = now + remaining * 1000;
    playStartHorn();
    syncState({
      ...battleState,
      timer: {
        ...battleState.timer,
        remaining,
        status: 'running',
        startedAt: battleState.timer.startedAt || now,
        endsAt,
      },
      lastUpdated: now,
    });
  }, [battleState, syncState]);

  const resetTimer = useCallback((newDurationSec = null) => {
    const duration = newDurationSec !== null ? newDurationSec : battleState.timer.duration;
    const now = Date.now();
    syncState({
      ...battleState,
      timer: {
        duration,
        remaining: duration,
        status: 'idle',
        startedAt: null,
        endsAt: null,
      },
      lastUpdated: now,
    });
  }, [battleState, syncState]);

  const submitParticipantWork = useCallback(({ participantId = '', name, teamName = '', notes = '', tokensUsed = 0, workUrl = '' }) => {
    const now = Date.now();
    let elapsedSec = 0;
    if (battleState.timer.startedAt) {
      elapsedSec = Math.max(1, Math.floor((now - battleState.timer.startedAt) / 1000));
    }
    const minutes = Math.floor(elapsedSec / 60);
    const seconds = elapsedSec % 60;
    const finishTimeFormatted = `${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;

    const budget = Number(battleState.tokenBudget) || DEFAULT_TOKEN_BUDGET;
    const duration = Number(battleState.timer.duration) || DEFAULT_BATTLE_DURATION;
    const tokens = Number(tokensUsed) || 0;

    const scoring = evaluateTotalScore({
      tokensUsed: tokens,
      tokenBudget: budget,
      finishSeconds: elapsedSec,
      totalDurationSec: duration,
      objectiveScore: 0,
      finishStatus: 'Partially Fulfilled',
      presentationScore: 0,
      noveltyScore: 0,
    });

    const cleanParticipantId = (participantId || '').trim().toUpperCase() || `PB-${Math.floor(100 + Math.random() * 900)}`;

    const newParticipant = {
      id: `p-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      participantId: cleanParticipantId,
      name: name.trim(),
      teamName: teamName.trim() || 'Independent Contender',
      submittedAt: now,
      finishSeconds: elapsedSec,
      finishTimeFormatted,
      notes: notes.trim(),
      workUrl: (workUrl || '').trim(),
      tokensUsed: tokens,
      tokenScore: scoring.tokenScore,
      tokenPercentageUsed: scoring.tokenPercentageUsed,
      timeScore: scoring.timeScore,
      timePercentageUsed: scoring.timePercentageUsed,
      objectiveScore: 0,
      finishStatus: 'Partially Fulfilled',
      finishStatusNotes: '',
      presentationScore: 0,
      noveltyScore: 0,
      totalScore: scoring.totalScore,
      tabSwitches: 0,
    };

    playFinishFanfare();
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

      // Also update in quiz.submissions
      const currentSubmissions = { ...(prev.quiz?.submissions || {}) };
      if (currentSubmissions[participantId]) {
        currentSubmissions[participantId] = {
          ...currentSubmissions[participantId],
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
        quiz: {
          ...prev.quiz,
          submissions: currentSubmissions,
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

  // --- KAHOOT-STYLE LIVE QUIZ ACTIONS ---
  // When Admin launches a quiz question, it automatically switches ALL screens to Quiz view!
  const launchQuizQuestion = useCallback((questionIdx = 0) => {
    const now = Date.now();
    const quiz = battleState.quiz || { questions: DEFAULT_QUIZ_QUESTIONS };
    const questionsList = toSafeArray(quiz.questions, DEFAULT_QUIZ_QUESTIONS);
    const q = questionsList[questionIdx] || questionsList[0];
    const duration = q.timeLimit || 20;
    const questionEndsAt = now + duration * 1000;

    playStartHorn();

    syncState({
      ...battleState,
      activeArena: 'quiz', // Automatically switch auditorium and participant screens!
      quiz: {
        ...quiz,
        status: 'in_progress',
        currentQuestionIndex: questionIdx,
        questionEndsAt,
      },
      lastUpdated: now,
    });
  }, [battleState, syncState]);

  const endQuizQuestion = useCallback(() => {
    const now = Date.now();
    syncState({
      ...battleState,
      quiz: {
        ...battleState.quiz,
        status: 'question_ended',
        questionEndsAt: null,
      },
      lastUpdated: now,
    });
  }, [battleState, syncState]);

  const submitQuizAnswer = useCallback(({ participantId, participantName, teamName, questionIndex, selectedIndex, timeTakenSec }) => {
    const now = Date.now();
    const quiz = battleState.quiz || {};
    const questionsList = toSafeArray(quiz.questions, DEFAULT_QUIZ_QUESTIONS);
    const currentQ = questionsList[questionIndex];
    if (!currentQ) return { success: false };

    const isCorrect = selectedIndex === currentQ.correctIndex;
    let points = 0;

    if (isCorrect) {
      const maxTime = currentQ.timeLimit || 20;
      const ratio = Math.max(0, Math.min(1, timeTakenSec / maxTime));
      points = Math.round((1 - ratio / 2) * 1000);
    }

    const currentSubmissions = { ...(quiz.submissions || {}) };
    const userSubmission = currentSubmissions[participantId] || {
      participantId,
      name: participantName || 'Contender',
      teamName: teamName || 'Solo',
      answers: {},
      totalScore: 0,
      correctCount: 0,
    };

    userSubmission.answers[questionIndex] = {
      selectedIndex,
      isCorrect,
      points,
      timeTakenSec,
      answeredAt: now,
    };

    const allAnswers = Object.values(userSubmission.answers);
    userSubmission.totalScore = allAnswers.reduce((sum, a) => sum + (a.points || 0), 0);
    userSubmission.correctCount = allAnswers.filter((a) => a.isCorrect).length;

    currentSubmissions[participantId] = userSubmission;

    if (isCorrect) {
      playFinishFanfare();
    } else {
      playTimesUpAlert();
    }

    syncState({
      ...battleState,
      quiz: {
        ...quiz,
        submissions: currentSubmissions,
      },
      lastUpdated: now,
    });

    return { success: true, isCorrect, points };
  }, [battleState, syncState]);

  const publishQuizLeaderboard = useCallback((shouldPublish) => {
    const now = Date.now();
    syncState({
      ...battleState,
      quiz: {
        ...battleState.quiz,
        published: shouldPublish,
        status: shouldPublish ? 'finished' : battleState.quiz?.status,
      },
      lastUpdated: now,
    });
  }, [battleState, syncState]);

  const resetQuiz = useCallback(() => {
    const now = Date.now();
    syncState({
      ...battleState,
      quiz: {
        ...battleState.quiz,
        status: 'idle',
        currentQuestionIndex: 0,
        questionEndsAt: null,
        published: false,
        submissions: {},
      },
      lastUpdated: now,
    });
  }, [battleState, syncState]);

  const addQuizQuestion = useCallback((newQ) => {
    const now = Date.now();
    const currentList = toSafeArray(battleState.quiz?.questions, DEFAULT_QUIZ_QUESTIONS);
    const updatedQuestions = [...currentList, {
      id: `q-${Date.now()}`,
      question: newQ.question,
      options: toSafeArray(newQ.options, ['Option A', 'Option B', 'Option C', 'Option D']),
      correctIndex: Number(newQ.correctIndex) || 0,
      timeLimit: Number(newQ.timeLimit) || 20,
    }];

    syncState({
      ...battleState,
      quiz: {
        ...battleState.quiz,
        questions: updatedQuestions,
      },
      lastUpdated: now,
    });
  }, [battleState, syncState]);

  const updateQuizQuestion = useCallback((questionId, updatedData) => {
    const now = Date.now();
    const currentList = toSafeArray(battleState.quiz?.questions, DEFAULT_QUIZ_QUESTIONS);
    const updated = currentList.map((q) => {
      if (q.id === questionId) {
        return {
          ...q,
          question: (updatedData.question !== undefined ? updatedData.question : q.question).trim(),
          options: updatedData.options ? toSafeArray(updatedData.options, q.options) : q.options,
          correctIndex: updatedData.correctIndex !== undefined ? Number(updatedData.correctIndex) : q.correctIndex,
          timeLimit: updatedData.timeLimit !== undefined ? Number(updatedData.timeLimit) : q.timeLimit,
        };
      }
      return q;
    });

    syncState({
      ...battleState,
      quiz: {
        ...battleState.quiz,
        questions: updated,
      },
      lastUpdated: now,
    });
  }, [battleState, syncState]);

  const deleteQuizQuestion = useCallback((questionId) => {
    const now = Date.now();
    const currentList = toSafeArray(battleState.quiz?.questions, DEFAULT_QUIZ_QUESTIONS);
    const filtered = currentList.filter((q) => q.id !== questionId);
    const safeIdx = Math.max(0, Math.min(battleState.quiz?.currentQuestionIndex || 0, filtered.length - 1));

    syncState({
      ...battleState,
      quiz: {
        ...battleState.quiz,
        questions: filtered.length > 0 ? filtered : DEFAULT_QUIZ_QUESTIONS,
        currentQuestionIndex: safeIdx,
      },
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

  // Auth & General
  const authenticateAdmin = useCallback((enteredPassword) => {
    if (enteredPassword === ADMIN_PASSWORD) {
      setIsAdminAuthenticated(true);
      sessionStorage.setItem('pb_admin_auth', 'true');
      return { success: true };
    }
    return { success: false, error: 'Incorrect administrator password' };
  }, []);

  const logoutAdmin = useCallback(() => {
    setIsAdminAuthenticated(false);
    sessionStorage.removeItem('pb_admin_auth');
  }, []);

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
      ...DEFAULT_STATE,
      lastUpdated: now,
    });
  }, [syncState]);

  const safePoll = battleState.poll || DEFAULT_POLL;
  const safeQuiz = battleState.quiz || DEFAULT_STATE.quiz;

  const value = {
    battleState,
    activeArena: battleState.activeArena || 'battle',
    timer: battleState.timer,
    participants: toSafeArray(battleState.participants, []),
    registeredContenders: toSafeArray(battleState.registeredContenders, DEFAULT_CONTENDERS),
    tokenBudget: Number(battleState.tokenBudget) || DEFAULT_TOKEN_BUDGET,
    published: battleState.published,
    joinedParticipants: battleState.joinedParticipants || {},
    totalJoinedCount: Math.max(
      Object.keys(battleState.joinedParticipants || {}).length,
      toSafeArray(battleState.participants, []).length,
      toSafeArray(battleState.registeredContenders, []).length,
      Object.keys(battleState.poll?.votes || {}).length,
      Object.keys(battleState.quiz?.submissions || {}).length
    ),
    poll: {
      ...safePoll,
      displayMode: safePoll.displayMode || 'percentage',
      options: toSafeArray(safePoll.options, DEFAULT_POLL.options),
      votes: safePoll.votes || {},
    },
    quiz: {
      ...safeQuiz,
      questions: toSafeArray(safeQuiz.questions, DEFAULT_QUIZ_QUESTIONS),
      submissions: safeQuiz.submissions || {},
    },
    isAdminAuthenticated,
    activeView,
    firebaseStatus,
    firebaseError,
    switchView,
    switchArena,

    // Contender Roster & Settings
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

    // Poll
    createPoll,
    updatePoll,
    deletePoll,
    submitVote,
    setPollStatus,
    setPollDisplayMode,
    publishPollResults,
    resetPoll,

    // Presence & Anti-Cheat
    registerPresence,
    reportTabSwitch,

    // Quiz
    launchQuizQuestion,
    endQuizQuestion,
    submitQuizAnswer,
    publishQuizLeaderboard,
    resetQuiz,
    addQuizQuestion,
    updateQuizQuestion,
    deleteQuizQuestion,

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
