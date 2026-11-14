import React, { useState, useEffect, useRef } from 'react';
import { useBattle } from '../context/BattleContext';
import { 
  HelpCircle, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ShieldAlert, 
  Trophy, 
  Zap, 
  User, 
  Flame,
  Sparkles
} from 'lucide-react';

export default function ParticipantQuizView() {
  const { quiz, submitQuizAnswer } = useBattle();

  const [participantName, setParticipantName] = useState(() => {
    return localStorage.getItem('pb_quiz_participant_name') || '';
  });
  const [teamName, setTeamName] = useState(() => {
    return localStorage.getItem('pb_quiz_team_name') || '';
  });
  const [isRegistered, setIsRegistered] = useState(() => {
    return Boolean(localStorage.getItem('pb_quiz_participant_name'));
  });

  const [selectedIdx, setSelectedIdx] = useState(null);
  const [hasAnsweredCurrent, setHasAnsweredCurrent] = useState(false);
  const [answerResult, setAnswerResult] = useState(null); // { isCorrect, points }

  // Anti-Cheat / App-Switching Lock State
  const [focusViolated, setFocusViolated] = useState(false);
  const [violationCount, setViolationCount] = useState(0);

  const questionStartTimeRef = useRef(Date.now());

  const participantId = useState(() => {
    let id = localStorage.getItem('pb_quiz_uuid');
    if (!id) {
      id = `qz-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      localStorage.setItem('pb_quiz_uuid', id);
    }
    return id;
  })[0];

  const currentIdx = quiz?.currentQuestionIndex || 0;
  const questions = quiz?.questions || [];
  const currentQ = questions[currentIdx];
  const isQuestionRunning = quiz?.status === 'in_progress';
  const isQuestionEnded = quiz?.status === 'question_ended';
  const isQuizFinished = quiz?.status === 'finished' || quiz?.published;

  // Track user submissions
  const mySubmission = quiz?.submissions?.[participantId] || null;
  const myTotalScore = mySubmission?.totalScore || 0;

  // Reset answer state when a new question arrives
  useEffect(() => {
    questionStartTimeRef.current = Date.now();
    const prevAnswer = mySubmission?.answers?.[currentIdx];
    if (prevAnswer) {
      setSelectedIdx(prevAnswer.selectedIndex);
      setHasAnsweredCurrent(true);
      setAnswerResult({ isCorrect: prevAnswer.isCorrect, points: prevAnswer.points });
    } else {
      setSelectedIdx(null);
      setHasAnsweredCurrent(false);
      setAnswerResult(null);
    }
  }, [currentIdx, mySubmission]);

  // Anti-Switching Focus Protection
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && isQuestionRunning && !hasAnsweredCurrent) {
        setFocusViolated(true);
        setViolationCount((prev) => prev + 1);
      }
    };

    const handleBlur = () => {
      if (isQuestionRunning && !hasAnsweredCurrent) {
        setFocusViolated(true);
        setViolationCount((prev) => prev + 1);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
    };
  }, [isQuestionRunning, hasAnsweredCurrent]);

  const handleRegister = (e) => {
    e.preventDefault();
    if (!participantName.trim()) return;
    localStorage.setItem('pb_quiz_participant_name', participantName.trim());
    localStorage.setItem('pb_quiz_team_name', teamName.trim() || 'Solo');
    setIsRegistered(true);
  };

  const handleSelectOption = (idx) => {
    if (hasAnsweredCurrent || !isQuestionRunning) return;

    const timeTakenSec = Math.max(0.5, (Date.now() - questionStartTimeRef.current) / 1000);
    setSelectedIdx(idx);
    setHasAnsweredCurrent(true);

    const res = submitQuizAnswer({
      participantId,
      participantName: participantName.trim() || 'Contender',
      teamName: teamName.trim() || 'Solo',
      questionIndex: currentIdx,
      selectedIndex: idx,
      timeTakenSec,
    });

    if (res.success) {
      setAnswerResult({ isCorrect: res.isCorrect, points: res.points });
    }
  };

  // Screen 1: Registration before quiz starts
  if (!isRegistered) {
    return (
      <div className="w-full max-w-md mx-auto py-8 px-4">
        <form onSubmit={handleRegister} className="border border-white/10 rounded-xl p-6 bg-dark-900/90 space-y-4 text-center">
          <div className="w-12 h-12 rounded-full bg-fest-pink/20 text-fest-pink flex items-center justify-center mx-auto border border-fest-pink/40">
            <Zap className="w-6 h-6" />
          </div>

          <h2 className="text-2xl font-bold font-sans text-white">
            Join Kahoot Quiz Arena
          </h2>
          <p className="text-xs font-mono text-slate-400">
            Speed & Accuracy Championship • EEE FEST 2026
          </p>

          <div className="space-y-3 text-left pt-2 font-mono text-xs">
            <div>
              <label className="block text-slate-300 mb-1">Your Full Name *</label>
              <input
                type="text"
                required
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                placeholder="e.g. Tanvir Mahmud"
                className="w-full px-3 py-2.5 rounded bg-dark-950 border border-white/15 text-white focus:border-fest-cyan text-sm"
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-1">Team Name (Optional)</label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g. DIU Neural / Solo"
                className="w-full px-3 py-2.5 rounded bg-dark-950 border border-white/15 text-white focus:border-fest-pink text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-lg bg-gradient-to-r from-fest-pink to-fest-cyan text-white font-mono text-xs font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(255,0,122,0.3)]"
          >
            Enter Live Quiz Lobby
          </button>
        </form>
      </div>
    );
  }

  // Kahoot Buttons Palette
  const kahootButtons = [
    { bg: 'bg-rose-600 hover:bg-rose-500 active:bg-rose-700', shape: '▲', label: 'A' },
    { bg: 'bg-fest-cyan hover:bg-cyan-400 active:bg-cyan-500 text-dark-950', shape: '◆', label: 'B' },
    { bg: 'bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-dark-950', shape: '●', label: 'C' },
    { bg: 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700', shape: '■', label: 'D' }
  ];

  return (
    <div className="w-full max-w-lg mx-auto py-4 px-4 space-y-4">
      
      {/* Anti-Switching Security Violation Warning Overlay */}
      {focusViolated && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
          <div className="p-6 rounded-xl border border-rose-500/50 bg-dark-900 text-center space-y-4 max-w-sm shadow-[0_0_40px_rgba(244,63,94,0.3)]">
            <div className="w-14 h-14 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/40">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h3 className="font-sans font-bold text-white text-lg">
              App Switching Prohibited!
            </h3>
            <p className="text-xs font-mono text-slate-300 leading-relaxed">
              Kahoot quiz focus violation recorded. Switching apps during active questions is against tournament rules.
            </p>
            <div className="text-[11px] font-mono text-rose-400">
              Violation Count: #{violationCount}
            </div>
            <button
              onClick={() => setFocusViolated(false)}
              className="w-full py-2.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold uppercase tracking-wider"
            >
              Resume Quiz
            </button>
          </div>
        </div>
      )}

      {/* Top Participant Status & Score Bar */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-dark-900 border border-white/10 font-mono text-xs">
        <div>
          <span className="text-white font-bold block">{participantName}</span>
          <span className="text-[10px] text-slate-400">Q {currentIdx + 1} of {questions.length}</span>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Kahoot Points</span>
          <span className="text-base font-extrabold text-fest-cyan">{myTotalScore} PTS</span>
        </div>
      </div>

      {/* Waiting or Active Question Display */}
      {quiz?.status === 'idle' ? (
        <div className="p-10 rounded-xl bg-dark-900/60 border border-white/10 text-center space-y-3 font-mono">
          <Zap className="w-8 h-8 text-fest-amber mx-auto animate-bounce" />
          <h3 className="text-lg font-bold text-white font-sans">Lobby Ready</h3>
          <p className="text-xs text-slate-400">
            Keep your phone awake! The moderator will launch the question to all devices simultaneously.
          </p>
        </div>
      ) : isQuizFinished ? (
        <div className="p-8 rounded-xl bg-dark-900/80 border border-emerald-500/40 text-center space-y-4 font-mono shadow-[0_0_30px_rgba(16,185,129,0.2)]">
          <Trophy className="w-12 h-12 text-fest-amber mx-auto" />
          <h3 className="text-2xl font-bold font-sans text-white">Quiz Concluded!</h3>
          <p className="text-xs text-slate-300">
            Final Score: <strong className="text-fest-cyan text-base">{myTotalScore} PTS</strong>
          </p>
          <p className="text-[11px] text-slate-400">
            Look up at the arena projector screen to see the final grand podium ranking!
          </p>
        </div>
      ) : (
        /* Active Question Tap Screen */
        <div className="space-y-4">
          
          {/* Question Text Preview */}
          <div className="p-4 rounded-xl bg-dark-950 border border-white/10 text-center font-sans font-bold text-white text-sm sm:text-base">
            {currentQ?.question}
          </div>

          {/* Feedback Banner if user answered */}
          {hasAnsweredCurrent && (
            <div className={`p-3 rounded-lg text-center font-mono text-xs border ${
              answerResult?.isCorrect
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-400'
            }`}>
              {answerResult?.isCorrect ? (
                <div className="flex items-center justify-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  CORRECT! +{answerResult?.points} PTS EARNED
                </div>
              ) : (
                <div className="flex items-center justify-center gap-1.5 font-bold">
                  <XCircle className="w-4 h-4" />
                  INCORRECT (0 PTS)
                </div>
              )}
            </div>
          )}

          {/* 4 Massive Kahoot Touch Quadrants */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            {currentQ?.options?.map((optText, optIdx) => {
              const b = kahootButtons[optIdx % 4];
              const isSelected = selectedIdx === optIdx;

              return (
                <button
                  key={optIdx}
                  disabled={hasAnsweredCurrent || !isQuestionRunning}
                  onClick={() => handleSelectOption(optIdx)}
                  className={`h-36 sm:h-44 rounded-2xl p-4 flex flex-col items-center justify-center transition-all duration-150 ${b.bg} text-white font-mono select-none shadow-lg active:scale-95 ${
                    isSelected
                      ? 'ring-4 ring-white shadow-2xl scale-[1.02]'
                      : hasAnsweredCurrent
                      ? 'opacity-40 grayscale-[30%]'
                      : 'hover:opacity-95'
                  }`}
                >
                  <span className="text-3xl sm:text-4xl font-bold mb-1">
                    {b.shape}
                  </span>
                  <span className="text-xs sm:text-sm font-sans font-bold text-center line-clamp-2 px-1 leading-snug">
                    {optText}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="text-center font-mono text-[11px] text-slate-400 pt-1">
            {hasAnsweredCurrent ? 'Answer locked. Awaiting next question...' : 'Tap matching color as fast as possible!'}
          </div>

        </div>
      )}

    </div>
  );
}
