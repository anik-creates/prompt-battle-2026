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

const STORAGE_KEY = 'pb_local_state_v1';
const BROADCAST_CHANNEL_NAME = 'prompt_battle_broadcast_v1';
const ADMIN_PASSWORD = 'eeefestadmin';

const INITIAL_DURATION = 1200; // 20 minutes default

const DEFAULT_STATE = {
  timer: {
    duration: INITIAL_DURATION,
    remaining: INITIAL_DURATION,
    status: 'idle', // 'idle' | 'running' | 'paused' | 'finished'
    startedAt: null,
    endsAt: null,
  },
  published: false,
  participants: [],
  lastUpdated: Date.now(),
};

// Demo participants for testing/rehearsals
export const DEMO_PARTICIPANTS = [
  {
    id: 'demo-1',
    name: 'Tanvir Mahmud',
    teamName: 'Prompt Architects',
    submittedAt: Date.now() - 1000 * 60 * 7,
    finishSeconds: 524,
    finishTimeFormatted: '08m 44s',
    notes: 'Used multi-chain prompt decomposition with zero-shot constraint verification.',
    tokensUsed: 620,
    objectiveScore: 29,
    finishStatus: 'Fully Completed',
    finishStatusNotes: 'Met 100% test assertions on edge cases',
    presentationScore: 24,
    noveltyScore: 25,
    totalScore: 96,
  },
  {
    id: 'demo-2',
    name: 'Amina Khatun',
    teamName: 'Syntax Sorcerers',
    submittedAt: Date.now() - 1000 * 60 * 5,
    finishSeconds: 672,
    finishTimeFormatted: '11m 12s',
    notes: 'Implemented few-shot persona anchoring and markdown syntax strict formatting.',
    tokensUsed: 890,
    objectiveScore: 27,
    finishStatus: 'Fully Completed',
    finishStatusNotes: 'Excellent output structure and clarity',
    presentationScore: 23,
    noveltyScore: 22,
    totalScore: 89,
  },
  {
    id: 'demo-3',
    name: 'Rafiqul Islam',
    teamName: 'Neural Pulse DIU',
    submittedAt: Date.now() - 1000 * 60 * 3,
    finishSeconds: 835,
    finishTimeFormatted: '13m 55s',
    notes: 'Step-by-step reasoning technique with self-correction loops.',
    tokensUsed: 1140,
    objectiveScore: 24,
    finishStatus: 'Substantially Completed',
    finishStatusNotes: 'Minor omission in edge case #3',
    presentationScore: 20,
    noveltyScore: 21,
    totalScore: 80,
  },
  {
    id: 'demo-4',
    name: 'Mehedi Hasan',
    teamName: 'Quantum Coders',
    submittedAt: Date.now() - 1000 * 60 * 1,
    finishSeconds: 980,
    finishTimeFormatted: '16m 20s',
    notes: 'Direct systemic prompt with strict guardrail definitions.',
    tokensUsed: 740,
    objectiveScore: 22,
    finishStatus: 'Partially Fulfilled',
    finishStatusNotes: 'Functional solution, pending final formatting',
    presentationScore: 19,
    noveltyScore: 18,
    totalScore: 74,
  }
];

export function BattleProvider({ children }) {
  // Master app state
  const [battleState, setBattleState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_STATE, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Failed to load local battle state:', e);
    }
    return DEFAULT_STATE;
  });

  // Admin session authentication
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return sessionStorage.getItem('pb_admin_auth') === 'true';
  });

  // Active view routing ('presentation' | 'admin' | 'submit')
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

  // Firebase status
  const [firebaseStatus, setFirebaseStatus] = useState('unconfigured'); // 'unconfigured' | 'connecting' | 'connected' | 'error'
  const [firebaseError, setFirebaseError] = useState(null);

  // Cross-tab broadcast channel ref
  const broadcastRef = useRef(null);
  const isInternalUpdateRef = useRef(false);

  // Sync state to local storage and broadcast to other tabs
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
          isInternalUpdateRef.current = true;
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
      if (broadcastRef.current) {
        broadcastRef.current.close();
      }
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, []);

  // Initialize Firebase Cloud sync if config exists
  useEffect(() => {
    const config = getStoredFirebaseConfig();
    if (!config) {
      setFirebaseStatus('unconfigured');
      return;
    }

    setFirebaseStatus('connecting');
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
        setFirebaseError(err.message || 'Firestore connection issue');
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Active Timer Tick Loop
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
          // Play tick in final 10 seconds
          if (remainingSec <= 10 && remainingSec !== battleState.timer.remaining) {
            playCountdownTick();
          }

          setBattleState((prev) => {
            if (prev.timer.remaining === remainingSec) return prev;
            const updated = {
              ...prev,
              timer: {
                ...prev.timer,
                remaining: remainingSec,
              },
            };
            // Note: Don't write to storage every second to avoid performance drag;
            // endsAt is preserved, so any reload computes remaining automatically.
            return updated;
          });
        }
      }, 250);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [battleState.timer.status, battleState.timer.endsAt, battleState, syncState]);

  // Sync URL hash / query with active view
  const switchView = useCallback((newView) => {
    setActiveView(newView);
    window.location.hash = `#${newView}`;
  }, []);

  // --- ACTIONS ---

  const startTimer = useCallback((customDurationSec = null) => {
    const duration = customDurationSec !== null ? customDurationSec : battleState.timer.duration;
    const now = Date.now();
    const endsAt = now + duration * 1000;

    playStartHorn();

    const newState = {
      ...battleState,
      timer: {
        duration,
        remaining: duration,
        status: 'running',
        startedAt: now,
        endsAt,
      },
      lastUpdated: now,
    };
    syncState(newState);
  }, [battleState, syncState]);

  const pauseTimer = useCallback(() => {
    const now = Date.now();
    let currentRemaining = battleState.timer.remaining;
    if (battleState.timer.endsAt) {
      currentRemaining = Math.max(0, Math.ceil((battleState.timer.endsAt - now) / 1000));
    }

    const newState = {
      ...battleState,
      timer: {
        ...battleState.timer,
        remaining: currentRemaining,
        status: 'paused',
        endsAt: null,
      },
      lastUpdated: now,
    };
    syncState(newState);
  }, [battleState, syncState]);

  const resumeTimer = useCallback(() => {
    const now = Date.now();
    const remaining = battleState.timer.remaining > 0 ? battleState.timer.remaining : battleState.timer.duration;
    const endsAt = now + remaining * 1000;

    playStartHorn();

    const newState = {
      ...battleState,
      timer: {
        ...battleState.timer,
        remaining,
        status: 'running',
        startedAt: battleState.timer.startedAt || now,
        endsAt,
      },
      lastUpdated: now,
    };
    syncState(newState);
  }, [battleState, syncState]);

  const resetTimer = useCallback((newDurationSec = null) => {
    const duration = newDurationSec !== null ? newDurationSec : battleState.timer.duration;
    const now = Date.now();

    const newState = {
      ...battleState,
      timer: {
        duration,
        remaining: duration,
        status: 'idle',
        startedAt: null,
        endsAt: null,
      },
      lastUpdated: now,
    };
    syncState(newState);
  }, [battleState, syncState]);

  // Participant finishes and submits work
  const submitParticipantWork = useCallback(({ name, teamName, notes = '' }) => {
    const now = Date.now();
    let elapsedSec = 0;
    
    if (battleState.timer.startedAt) {
      elapsedSec = Math.max(1, Math.floor((now - battleState.timer.startedAt) / 1000));
    } else {
      elapsedSec = 0;
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

    const newState = {
      ...battleState,
      participants: [newParticipant, ...battleState.participants],
      lastUpdated: now,
    };

    syncState(newState);
    return newParticipant;
  }, [battleState, syncState]);

  // Admin marks / updates a participant
  const updateParticipantMarks = useCallback((id, updates) => {
    const now = Date.now();
    const updatedParticipants = battleState.participants.map((p) => {
      if (p.id !== id) return p;
      const merged = { ...p, ...updates };

      // Calculate total score based on factors:
      // Objective (max 30) + Status weight (max 20) + Presentation (max 25) + Novelty (max 25)
      let statusWeight = 12;
      if (merged.finishStatus === 'Fully Completed') statusWeight = 20;
      else if (merged.finishStatus === 'Substantially Completed') statusWeight = 16;
      else if (merged.finishStatus === 'Partially Fulfilled') statusWeight = 12;
      else if (merged.finishStatus === 'Minimal Fulfillment') statusWeight = 6;

      const obj = Number(merged.objectiveScore) || 0;
      const pres = Number(merged.presentationScore) || 0;
      const nov = Number(merged.noveltyScore) || 0;
      
      // Auto-compute total if not manually overridden
      const computedTotal = obj + statusWeight + pres + nov;
      merged.totalScore = updates.totalScore !== undefined ? Number(updates.totalScore) : computedTotal;

      return merged;
    });

    const newState = {
      ...battleState,
      participants: updatedParticipants,
      lastUpdated: now,
    };
    syncState(newState);
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

    const newState = {
      ...battleState,
      participants: [newParticipant, ...battleState.participants],
      lastUpdated: now,
    };
    syncState(newState);
  }, [battleState, syncState]);

  const removeParticipant = useCallback((id) => {
    const now = Date.now();
    const newState = {
      ...battleState,
      participants: battleState.participants.filter((p) => p.id !== id),
      lastUpdated: now,
    };
    syncState(newState);
  }, [battleState, syncState]);

  // Admin toggles Leaderboard publication on presentation screen
  const togglePublishLeaderboard = useCallback((shouldPublish) => {
    const now = Date.now();
    const newState = {
      ...battleState,
      published: shouldPublish,
      lastUpdated: now,
    };
    syncState(newState);
  }, [battleState, syncState]);

  // Admin Authentication
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

  // Firebase Config Setup
  const configureFirebase = useCallback((configObj) => {
    saveStoredFirebaseConfig(configObj);
    const res = initFirebase(configObj);
    if (res.success) {
      setFirebaseStatus('connected');
      setFirebaseError(null);
      // Push current state to cloud
      pushStateToCloud(battleState);
      return { success: true };
    } else {
      setFirebaseStatus('error');
      setFirebaseError(res.error);
      return { success: false, error: res.error };
    }
  }, [battleState]);

  const loadDemo = useCallback(() => {
    const now = Date.now();
    const newState = {
      ...battleState,
      participants: DEMO_PARTICIPANTS,
      lastUpdated: now,
    };
    syncState(newState);
  }, [battleState, syncState]);

  const resetAllData = useCallback(() => {
    const now = Date.now();
    const newState = {
      ...DEFAULT_STATE,
      lastUpdated: now,
    };
    syncState(newState);
  }, [syncState]);

  const value = {
    battleState,
    timer: battleState.timer,
    participants: battleState.participants,
    published: battleState.published,
    isAdminAuthenticated,
    activeView,
    firebaseStatus,
    firebaseError,
    switchView,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    submitParticipantWork,
    updateParticipantMarks,
    addManualParticipant,
    removeParticipant,
    togglePublishLeaderboard,
    authenticateAdmin,
    logoutAdmin,
    configureFirebase,
    loadDemo,
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
