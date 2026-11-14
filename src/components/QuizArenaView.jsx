import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useBattle, toSafeArray, DEFAULT_QUIZ_QUESTIONS } from '../context/BattleContext';
import { 
  HelpCircle, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Trophy, 
  Users, 
  Sparkles, 
  Medal, 
  Flame, 
  Zap, 
  ArrowRight
} from 'lucide-react';

export default function QuizArenaView() {
  const { quiz } = useBattle();

  const safeQuiz = quiz || {};
  const currentIdx = safeQuiz.currentQuestionIndex || 0;
  const questions = toSafeArray(safeQuiz.questions, DEFAULT_QUIZ_QUESTIONS);
  const currentQ = questions[currentIdx] || questions[0] || DEFAULT_QUIZ_QUESTIONS[0];
  const isFinished = safeQuiz.status === 'finished' || safeQuiz.published;
  const isQuestionEnded = safeQuiz.status === 'question_ended';
  const isInProgress = safeQuiz.status === 'in_progress';

  // Calculate live responses for current question
  const submissions = Object.values(safeQuiz.submissions || {});
  const answeredForCurrent = submissions.filter((s) => s.answers && s.answers[currentIdx] !== undefined);

  // Compute leaderboard sorted by totalScore descending
  const sortedContenders = [...submissions].sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));

  // Confetti when Grand Leaderboard published
  useEffect(() => {
    if (isFinished) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#00e5ff', '#ff007a', '#ffb700', '#6cb33f']
        });
      } catch (e) {
        console.warn(e);
      }
    }
  }, [isFinished]);

  // If Quiz finished/published: render Grand Kahoot Podium
  if (isFinished) {
    return (
      <div className="w-full max-w-7xl mx-auto py-8 sm:py-12 space-y-10">
        
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-fest-pink/15 border border-fest-pink/30 text-fest-pink text-xs font-mono uppercase tracking-widest mb-3">
            <Trophy className="w-4 h-4 text-fest-amber" />
            Official Quiz Championship Results
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white font-sans tracking-tight">
            KAHOOT ARENA <span className="text-fest-gradient">GRAND PODIUM</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-mono mt-2">
            Speed & Precision • IEEE PES DIU SBC • EEE FEST 2026
          </p>
        </div>

        {sortedContenders.length === 0 ? (
          <div className="py-20 text-center font-mono text-slate-400 border border-white/10 rounded-lg">
            No quiz submissions recorded yet.
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* Top 3 Podium */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end">
              {sortedContenders.slice(0, 3).map((p, idx) => {
                const rank = idx + 1;
                const isChampion = rank === 1;

                const styling = isChampion
                  ? 'border-fest-amber/60 bg-gradient-to-b from-fest-amber/15 via-dark-900 to-dark-950 shadow-[0_0_30px_rgba(255,183,0,0.2)] md:-translate-y-4'
                  : rank === 2
                  ? 'border-slate-300/40 bg-gradient-to-b from-slate-300/10 via-dark-900 to-dark-950 shadow-[0_0_20px_rgba(203,213,225,0.1)]'
                  : 'border-amber-700/50 bg-gradient-to-b from-amber-700/10 via-dark-900 to-dark-950 shadow-[0_0_20px_rgba(180,83,9,0.1)]';

                return (
                  <div key={p.participantId || idx} className={`p-6 rounded-xl border relative transition-all ${styling}`}>
                    <div className="flex items-center justify-between mb-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider ${
                        isChampion ? 'bg-fest-amber/20 text-fest-amber border border-fest-amber/40' : 'bg-white/10 text-slate-200'
                      }`}>
                        <Trophy className="w-3.5 h-3.5" />
                        #{rank} {isChampion ? 'CHAMPION' : rank === 2 ? 'RUNNER UP' : '3RD PLACE'}
                      </span>
                      <span className="text-2xl font-mono font-extrabold text-white">
                        {p.totalScore || 0} <span className="text-xs text-slate-400 font-normal">PTS</span>
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-white font-sans truncate">{p.name}</h3>
                    <p className="text-xs text-fest-cyan font-mono truncate mt-0.5">{p.teamName || 'Solo'}</p>

                    <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-mono text-slate-300">
                      <span>Correct Answers:</span>
                      <span className="font-bold text-emerald-400">{p.correctCount || 0} / {questions.length}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Complete Contenders Table */}
            <div className="overflow-x-auto border border-white/10 rounded-lg">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-dark-950 text-slate-400 uppercase tracking-wider text-[11px] border-b border-white/10">
                  <tr>
                    <th className="py-3 px-4">Rank</th>
                    <th className="py-3 px-4 font-sans font-bold">Contender / Team</th>
                    <th className="py-3 px-4 text-center">Correct Answers</th>
                    <th className="py-3 px-4 text-center">Accuracy</th>
                    <th className="py-3 px-4 text-right font-bold text-white">Total Kahoot Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 bg-dark-900/40">
                  {sortedContenders.map((p, idx) => (
                    <tr key={p.participantId || idx} className="hover:bg-white/[0.02]">
                      <td className="py-3 px-4 font-bold text-fest-cyan">#{idx + 1}</td>
                      <td className="py-3 px-4 font-sans font-semibold text-white">
                        {p.name} <span className="text-xs text-slate-400 font-mono">({p.teamName})</span>
                      </td>
                      <td className="py-3 px-4 text-center text-emerald-400 font-bold">
                        {p.correctCount || 0} / {questions.length}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-300">
                        {Math.round(((p.correctCount || 0) / (questions.length || 1)) * 100)}%
                      </td>
                      <td className="py-3 px-4 text-right text-base font-extrabold text-white font-mono">
                        {p.totalScore || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}
      </div>
    );
  }

  const qOptions = toSafeArray(currentQ?.options, ['Option A', 'Option B', 'Option C', 'Option D']);

  // Active Question Screen (During Live Kahoot Battle)
  return (
    <div className="w-full max-w-6xl mx-auto py-6 sm:py-10 space-y-8">
      
      {/* Top Question Tracker */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10 font-mono text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-fest-cyan" />
          <span className="text-white font-bold uppercase tracking-wider">
            Question {currentIdx + 1} of {questions.length}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-fest-pink font-bold">
            <Users className="w-3.5 h-3.5" />
            {answeredForCurrent.length} Responses Received
          </span>
          <span>•</span>
          <span className={`px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
            isInProgress ? 'bg-emerald-500/20 text-emerald-400 animate-pulse' : 'bg-rose-500/20 text-rose-400'
          }`}>
            {isInProgress ? 'Time Running' : 'Time Up'}
          </span>
        </div>
      </div>

      {/* Main Massive Question Banner */}
      <div className="p-8 sm:p-12 rounded-2xl bg-dark-900/80 border border-white/15 text-center relative overflow-hidden shadow-[0_0_35px_rgba(0,0,0,0.8)]">
        <div className="text-xs uppercase font-mono tracking-widest text-fest-cyan mb-3">
          Prompt Engineering Kahoot Challenge
        </div>
        <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white font-sans tracking-tight max-w-4xl mx-auto leading-tight">
          {currentQ?.question}
        </h2>
      </div>

      {/* Kahoot 4-Quadrant Option Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {qOptions.map((text, optIdx) => {
          const isCorrect = optIdx === currentQ.correctIndex;
          const showAnswer = isQuestionEnded;

          const optionThemes = [
            { border: 'border-rose-500/40', bg: 'bg-rose-950/30 hover:bg-rose-950/50', badge: 'bg-rose-500 text-white', shape: '▲' },
            { border: 'border-fest-cyan/40', bg: 'bg-cyan-950/30 hover:bg-cyan-950/50', badge: 'bg-fest-cyan text-dark-950', shape: '◆' },
            { border: 'border-amber-500/40', bg: 'bg-amber-950/30 hover:bg-amber-950/50', badge: 'bg-amber-500 text-dark-950', shape: '●' },
            { border: 'border-emerald-500/40', bg: 'bg-emerald-950/30 hover:bg-emerald-950/50', badge: 'bg-emerald-500 text-dark-950', shape: '■' }
          ];

          const t = optionThemes[optIdx % 4];

          const choseThisCount = answeredForCurrent.filter(
            (s) => s.answers && s.answers[currentIdx]?.selectedIndex === optIdx
          ).length;

          return (
            <div
              key={optIdx}
              className={`p-6 sm:p-8 rounded-xl border transition-all duration-500 flex items-center justify-between ${
                showAnswer && isCorrect
                  ? 'border-emerald-400 bg-emerald-950/50 ring-2 ring-emerald-400 shadow-[0_0_35px_rgba(16,185,129,0.35)]'
                  : showAnswer
                  ? 'border-white/5 opacity-50 bg-dark-950/40'
                  : `${t.border} ${t.bg}`
              }`}
            >
              <div className="flex items-center space-x-4">
                <span className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-base font-mono shadow-md ${t.badge}`}>
                  {t.shape}
                </span>
                <span className="font-sans font-bold text-white text-lg sm:text-xl">
                  {text}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {showAnswer && isCorrect && (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                )}
                {showAnswer && (
                  <span className="font-mono text-sm text-slate-300 font-bold px-2 py-1 rounded bg-black/40">
                    {choseThisCount}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
