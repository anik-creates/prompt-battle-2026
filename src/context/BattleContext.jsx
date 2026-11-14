import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { 
  initFirebase, 
  subscribeToCloudState, 
  pushStateToCloud, 
  getStoredFirebaseConfig, 
  saveStoredFirebaseConfig 
} from '../lib/firebase';
import { playCountdownTick, playStartHorn, playFinishFanfare, playTimesUpAlert } from '../lib/sound';

const BattleContext = createContext(null);

const STORAGE_KEY = 'pb_local_state_v2';
const BROADCAST_CHANNEL_NAME = 'prompt_battle_broadcast_v2';
const ADMIN_PASSWORD = 'eeefestadmin';

const INITIAL_DURATION = 1200; // 20 minutes default

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
    timeLimit: 20, // seconds
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
  type: 'mcq', // 'voting' (opinion) or 'mcq' (has correct answer)
  status: 'active', // 'idle' | 'active' | 'closed'
  published: false,
  options: [
    { id: 'opt-1', text: 'Mixture of Experts (MoE) with CoT', isCorrect: true, votes: 0 },
    { id: 'opt-2', text: 'Dense Monolithic 7B Parameter Model', isCorrect: false, votes: 0 },
    { id: 'opt-3', text: 'Unquantized Recurrent Baseline', isCorrect: false, votes: 0 },
    { id: 'opt-4', text: 'Standard Zero-Shot Feedforward', isCorrect: false, votes: 0 }
  ],
  votes: {}, // participantId -> { optionId, name, timestamp }
};

const DEFAULT_STATE = {
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

  // Live Polling State
  poll: DEFAULT_POLL,

  // Kahoot-Style Live Quiz State
  quiz: {
    id: 'quiz-main',
    title: 'Prompt Battle 2026 Kahoot Arena',
    status: 'idle', // 'idle' | 'in_progress' | 'question_ended' | 'finished'
    currentQuestionIndex: 0,
    questionEndsAt: null,
    published: false,
    questions: DEFAULT_QUIZ_QUESTIONS,
    submissions: {}, // participantId -> { name, teamName, answers: { [qIdx]: { selectedIndex, isCorrect, points, timeTakenSec } }, totalScore: 0 }
  },

  lastUpdated: Date.now(),
};

export function BattleProvider({ children }) {
  const [battleState, setBattleState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_STATE, ...JSON.parse(saved) };
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
    setBattleState(newState);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    } catch (e) {
      console.warn(e);
    }

    if (broadcastRef.current) {
      try {
        broadcastRef.current.postMessage({ type: 'STATE_UPDATE', payload: newState });
      } catch (err) {
        console.warn('Broadcast error:', err);
      }
    }

    if (shouldPushCloud) {
      pushStateToCloud(newState).catch((err) => console.warn('Cloud sync error:', err));
    }
  }, []);

  // Initialize BroadcastChannel & Storage Event Listeners
  useEffect(() => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      broadcastRef.current = channel;

      channel.onmessage = (event) => {
        if (event.data?.type === 'STATE_UPDATE' && event.data.payload) {
          setBattleState(event.data.payload);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(event.data.payload));
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
          setBattleState(parsed);
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
              try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudData));
              } catch (e) {
                console.warn(e);
              }
              return cloudData;
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
          // Automatically transition to question_ended
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

  const submitParticipantWork = useCallback(({ name, teamName, notes = '' }) => {
    const now = Date.now();
    let elapsedSec = 0;
    if (battleState.timer.startedAt) {
      elapsedSec = Math.max(1, Math.floor((now - battleState.timer.startedAt) / 1000));
    }
    const minutes = Math.floor(elapsedSec / 60);
    const seconds = elapsedSec % 60;
    const finishTimeFormatted = `${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;

    const newParticipant = {
      id: `p-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      teamName: teamName.trim() || 'Independent Contender',
      submittedAt: now,
      finishSeconds: elapsedSec,
      finishTimeFormatted,
      notes: notes.trim(),
      tokensUsed: 0,
      objectiveScore: 0,
      finishStatus: 'Partially Fulfilled',
      finishStatusNotes: '',
      presentationScore: 0,
      noveltyScore: 0,
      totalScore: 0,
    };

    playFinishFanfare();
    syncState({
      ...battleState,
      participants: [newParticipant, ...battleState.participants],
      lastUpdated: now,
    });
    return newParticipant;
  }, [battleState, syncState]);

  const updateParticipantMarks = useCallback((id, updates) => {
    const now = Date.now();
    const updated = battleState.participants.map((p) => {
      if (p.id !== id) return p;
      const merged = { ...p, ...updates };
      let statusWeight = 12;
      if (merged.finishStatus === 'Fully Completed') statusWeight = 20;
      else if (merged.finishStatus === 'Substantially Completed') statusWeight = 16;
      else if (merged.finishStatus === 'Partially Fulfilled') statusWeight = 12;
      else if (merged.finishStatus === 'Minimal Fulfillment') statusWeight = 6;

      const obj = Number(merged.objectiveScore) || 0;
      const pres = Number(merged.presentationScore) || 0;
      const nov = Number(merged.noveltyScore) || 0;
      const computedTotal = obj + statusWeight + pres + nov;
      merged.totalScore = updates.totalScore !== undefined ? Number(updates.totalScore) : computedTotal;
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
    const newParticipant = {
      id: `p-manual-${Date.now()}`,
      name: participantData.name || 'New Participant',
      teamName: participantData.teamName || 'Solo',
      submittedAt: now,
      finishSeconds: participantData.finishSeconds || 0,
      finishTimeFormatted: participantData.finishTimeFormatted || 'Manual Entry',
      notes: participantData.notes || '',
      tokensUsed: Number(participantData.tokensUsed) || 0,
      objectiveScore: Number(participantData.objectiveScore) || 0,
      finishStatus: participantData.finishStatus || 'Fully Completed',
      finishStatusNotes: participantData.finishStatusNotes || '',
      presentationScore: Number(participantData.presentationScore) || 0,
      noveltyScore: Number(participantData.noveltyScore) || 0,
      totalScore: Number(participantData.totalScore) || 0,
    };
    syncState({
      ...battleState,
      participants: [newParticipant, ...battleState.participants],
      lastUpdated: now,
    });
  }, [battleState, syncState]);

  const removeParticipant = useCallback((id) => {
    const now = Date.now();
    syncState({
      ...battleState,
      participants: battleState.participants.filter((p) => p.id !== id),
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
  const createPoll = useCallback(({ question, type, options }) => {
    const now = Date.now();
    const formattedOptions = options.map((opt, idx) => ({
      id: `opt-${idx + 1}`,
      text: opt.text.trim(),
      isCorrect: Boolean(opt.isCorrect),
      votes: 0,
    }));

    const newPoll = {
      id: `poll-${now}`,
      question: question.trim(),
      type: type || 'mcq',
      status: 'active',
      published: false,
      options: formattedOptions,
      votes: {},
    };

    syncState({
      ...battleState,
      poll: newPoll,
      activeArena: 'poll',
      lastUpdated: now,
    });
  }, [battleState, syncState]);

  const submitVote = useCallback(({ participantId, participantName, optionId }) => {
    const now = Date.now();
    const currentPoll = battleState.poll || DEFAULT_POLL;
    if (currentPoll.status === 'closed') {
      return { success: false, error: 'Voting is currently closed.' };
    }

    const currentVotes = { ...(currentPoll.votes || {}) };
    currentVotes[participantId] = {
      optionId,
      name: participantName || 'Contender',
      timestamp: now,
    };

    // Recalculate option vote counts
    const updatedOptions = currentPoll.options.map((opt) => {
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

  const resetPoll = useCallback(() => {
    const now = Date.now();
    syncState({
      ...battleState,
      poll: DEFAULT_POLL,
      lastUpdated: now,
    });
  }, [battleState, syncState]);

  // --- KAHOOT-STYLE LIVE QUIZ ACTIONS ---
  const launchQuizQuestion = useCallback((questionIdx = 0) => {
    const now = Date.now();
    const quiz = battleState.quiz || { questions: DEFAULT_QUIZ_QUESTIONS };
    const q = quiz.questions[questionIdx] || quiz.questions[0];
    const duration = q.timeLimit || 20;
    const questionEndsAt = now + duration * 1000;

    playStartHorn();

    syncState({
      ...battleState,
      activeArena: 'quiz',
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
    const quiz = battleState.quiz;
    const currentQ = quiz.questions[questionIndex];
    if (!currentQ) return { success: false };

    const isCorrect = selectedIndex === currentQ.correctIndex;
    let points = 0;

    if (isCorrect) {
      // Kahoot speed + accuracy formula:
      // Base 1000 points, linearly scaled by time taken
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

    // Record answer
    userSubmission.answers[questionIndex] = {
      selectedIndex,
      isCorrect,
      points,
      timeTakenSec,
      answeredAt: now,
    };

    // Recompute total score & accuracy
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
        status: shouldPublish ? 'finished' : battleState.quiz.status,
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
    const updatedQuestions = [...(battleState.quiz.questions || []), {
      id: `q-${Date.now()}`,
      question: newQ.question,
      options: newQ.options,
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

  const value = {
    battleState,
    activeArena: battleState.activeArena || 'battle',
    timer: battleState.timer,
    participants: battleState.participants,
    published: battleState.published,
    poll: battleState.poll || DEFAULT_POLL,
    quiz: battleState.quiz,
    isAdminAuthenticated,
    activeView,
    firebaseStatus,
    firebaseError,
    switchView,
    switchArena,

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
    submitVote,
    setPollStatus,
    publishPollResults,
    resetPoll,

    // Quiz
    launchQuizQuestion,
    endQuizQuestion,
    submitQuizAnswer,
    publishQuizLeaderboard,
    resetQuiz,
    addQuizQuestion,

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
