import React, { useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { useBattle, toSafeArray, DEFAULT_POLL } from '../context/BattleContext';
import { 
  BarChart3, 
  Vote, 
  CheckCircle2, 
  Clock, 
  QrCode, 
  ExternalLink, 
  Users, 
  Sparkles, 
  Trophy, 
  Medal, 
  Zap, 
  AlertTriangle,
  Flame
} from 'lucide-react';

export default function PollArenaView() {
  const { poll, totalJoinedCount } = useBattle();

  const safePoll = poll || DEFAULT_POLL;
  const optionsList = toSafeArray(safePoll.options, DEFAULT_POLL.options);
  const votesObj = safePoll.votes || {};
  const votesList = Object.values(votesObj);
  const totalVotes = votesList.length;
  const isMcq = safePoll.type === 'mcq';
  const isPublished = safePoll.published;
  const isClosed = safePoll.status === 'closed';
  const displayMode = safePoll.displayMode || 'percentage'; // 'percentage' | 'leaderboard'

  const submissionUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}#poll`
    : 'https://anik-creates.github.io/prompt-battle-2026/#poll';

  // Confetti when poll concludes or results are published
  useEffect(() => {
    if (isClosed || isPublished) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#00e5ff', '#ff007a', '#ffb700', '#6cb33f']
        });
      } catch (e) {}
    }
  }, [isClosed, isPublished]);

  // Compute MCQ Best Performers based on correctness and speed
  const correctOption = optionsList.find((o) => o.isCorrect);
  const mcqPerformers = votesList
    .map((v) => {
      const chosen = optionsList.find((o) => o.id === v.optionId);
      const isCorrect = chosen ? Boolean(chosen.isCorrect) : false;
      return {
        ...v,
        chosenText: chosen?.text || 'None',
        isCorrect,
        score: v.score !== undefined ? v.score : (isCorrect ? Math.max(100, Math.round((1 - (v.timeTakenSec || 5) / 30) * 1000)) : 0),
        timeTakenSec: v.timeTakenSec || 5,
      };
    })
    .sort((a, b) => {
      if (a.isCorrect !== b.isCorrect) return a.isCorrect ? -1 : 1;
      return (b.score || 0) - (a.score || 0);
    });

  // Winning majority option for voting mode
  const leadingOption = [...optionsList].sort((a, b) => (b.votes || 0) - (a.votes || 0))[0];

  return (
    <div className="w-full max-w-6xl mx-auto py-6 sm:py-10 space-y-8">
      
      {/* Header Banner */}
      <div className="text-center relative">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-fest-pink/15 border border-fest-pink/30 text-fest-pink text-xs font-mono tracking-widest uppercase mb-3">
          <Vote className="w-3.5 h-3.5" />
          {isMcq ? 'Live Arena MCQ Challenge' : 'Live Audience Opinion Poll'}
        </div>

        <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white font-sans tracking-tight max-w-4xl mx-auto leading-snug">
          {safePoll.question || 'Awaiting Question from Moderator...'}
        </h1>

        {/* Live Counters */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mt-4 text-xs font-mono text-slate-400">
          <span className="flex items-center gap-1.5 text-fest-cyan font-bold">
            <Users className="w-4 h-4" />
            <span>{totalVotes} Responded</span>
            <span className="text-slate-500">/</span>
            <span className="text-slate-300">{Math.max(totalVotes, totalJoinedCount)} Connected</span>
          </span>

          <span>•</span>

          <span className={`px-2.5 py-0.5 rounded-full uppercase tracking-wider text-[11px] font-bold ${
            safePoll.status === 'active'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse'
              : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
          }`}>
            {safePoll.status === 'active' ? 'Voting Live' : 'Voting Concluded'}
          </span>

          {isMcq && (
            <>
              <span>•</span>
              <span className="text-slate-300">
                Mode: <strong className="text-fest-amber uppercase">{displayMode}</strong>
              </span>
            </>
          )}
        </div>
      </div>

      {/* Roster of Who Submitted Answers */}
      {votesList.length > 0 && (
        <div className="p-4 rounded-xl bg-dark-900/80 border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Contenders Answered ({votesList.length}):</span>
            </span>
            <span className="text-[11px] text-slate-500">Live incoming responses</span>
          </div>

          <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto pr-1 scrollbar-thin">
            {votesList.map((v, i) => (
              <span 
                key={v.participantId || i} 
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-dark-950 border border-white/10 text-xs font-mono text-slate-200"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="font-semibold text-white">{v.name}</span>
                {v.tabSwitches > 0 && (
                  <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 font-bold border border-rose-500/40 text-[10px]">
                    ⚠️ {v.tabSwitches} sw
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* DISPLAY MODE 1: MCQ BEST PERFORMERS LEADERBOARD */}
      {isMcq && displayMode === 'leaderboard' ? (
        <div className="space-y-8 pt-4">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-fest-amber/20 border border-fest-amber/40 text-fest-amber text-xs font-mono uppercase tracking-wider mb-2">
              <Trophy className="w-3.5 h-3.5" />
              Fastest & Most Accurate Contenders
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-sans text-white">
              MCQ SPEED & PRECISION LEADERBOARD
            </h2>
            <p className="text-xs font-mono text-slate-400 mt-1">
              Correct Answer: <strong className="text-emerald-400 font-bold">{correctOption?.text || 'Option'}</strong>
            </p>
          </div>

          {/* Top 3 Podium for MCQ */}
          {mcqPerformers.filter((p) => p.isCorrect).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              {mcqPerformers.filter((p) => p.isCorrect).slice(0, 3).map((p, idx) => {
                const rank = idx + 1;
                const isChampion = rank === 1;

                const borderGlow = isChampion
                  ? 'border-fest-amber/60 bg-gradient-to-b from-fest-amber/15 via-dark-900 to-dark-950 shadow-[0_0_30px_rgba(255,183,0,0.25)] md:-translate-y-3'
                  : rank === 2
                  ? 'border-slate-300/40 bg-gradient-to-b from-slate-300/10 via-dark-900 to-dark-950'
                  : 'border-amber-700/50 bg-gradient-to-b from-amber-700/10 via-dark-900 to-dark-950';

                return (
                  <div key={p.participantId || idx} className={`p-6 rounded-xl border relative transition-all ${borderGlow}`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider ${
                        isChampion ? 'bg-fest-amber/20 text-fest-amber border border-fest-amber/40' : 'bg-white/10 text-slate-300'
                      }`}>
                        <Trophy className="w-3.5 h-3.5" />
                        #{rank} {isChampion ? 'CHAMPION' : rank === 2 ? 'RUNNER UP' : '3RD PLACE'}
                      </span>
                      <span className="text-2xl font-mono font-extrabold text-white">
                        {p.score} <span className="text-xs text-slate-400 font-normal">PTS</span>
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white font-sans truncate">{p.name}</h3>
                    <div className="flex items-center justify-between text-xs font-mono text-slate-400 mt-2 pt-2 border-t border-white/10">
                      <span>Response Speed:</span>
                      <strong className="text-fest-cyan">{p.timeTakenSec}s</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-10 text-center font-mono text-slate-400 border border-white/10 rounded-lg">
              No correct submissions recorded yet for this MCQ challenge.
            </div>
          )}

          {/* Full Ranked MCQ Table */}
          <div className="overflow-x-auto border border-white/10 rounded-xl scrollbar-thin">
            <table className="w-full min-w-[650px] text-left font-mono text-xs">
              <thead className="bg-dark-950 text-slate-400 uppercase tracking-wider text-[11px] border-b border-white/10">
                <tr>
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4 font-sans font-bold">Contender</th>
                  <th className="py-3 px-4 text-center">Outcome</th>
                  <th className="py-3 px-4 text-center">Time Taken</th>
                  <th className="py-3 px-4 text-center">Tab Switches</th>
                  <th className="py-3 px-4 text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-dark-900/40">
                {mcqPerformers.map((p, idx) => (
                  <tr key={p.participantId || idx} className="hover:bg-white/[0.02]">
                    <td className="py-3 px-4 font-bold text-fest-cyan">#{idx + 1}</td>
                    <td className="py-3 px-4 font-sans font-semibold text-white">
                      {p.name}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        p.isCorrect
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      }`}>
                        {p.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-slate-300">
                      {p.timeTakenSec}s
                    </td>
                    <td className="py-3 px-4 text-center">
                      {p.tabSwitches > 0 ? (
                        <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold border border-rose-500/40">
                          ⚠️ {p.tabSwitches} switches
                        </span>
                      ) : (
                        <span className="text-emerald-400">✓ Clean</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-base font-extrabold text-white">
                      {p.score}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* DISPLAY MODE 2: PERCENTAGE BAR CHARTS (FOR MCQ PERCENTAGE OR VOTING) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center border-y border-white/10 py-10">
          
          {/* Left: Options & Animated Progress Bars (Col 8) */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* If voting mode closed: highlight winner */}
            {!isMcq && (isClosed || isPublished) && leadingOption && (
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between text-xs font-mono text-emerald-300 mb-2">
                <span className="flex items-center gap-2 font-bold uppercase tracking-wider">
                  <Trophy className="w-4 h-4 text-emerald-400" />
                  <span>Winning Choice: {leadingOption.text}</span>
                </span>
                <span className="font-extrabold text-sm text-white">
                  {totalVotes > 0 ? Math.round((leadingOption.votes / totalVotes) * 100) : 0}% of votes
                </span>
              </div>
            )}

            {optionsList.map((opt, idx) => {
              const count = opt.votes || 0;
              const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
              const isCorrect = opt.isCorrect;
              const revealCorrect = isMcq && (isPublished || isClosed);

              const letter = String.fromCharCode(65 + idx);
              const colorAccents = [
                'border-fest-pink/40 text-fest-pink bg-fest-pink/10',
                'border-fest-cyan/40 text-fest-cyan bg-fest-cyan/10',
                'border-fest-amber/40 text-fest-amber bg-fest-amber/10',
                'border-fest-pes/40 text-fest-pes bg-fest-pes/10',
              ];

              return (
                <div 
                  key={opt.id || idx}
                  className={`relative p-4 sm:p-5 rounded-lg border transition-all duration-500 overflow-hidden ${
                    revealCorrect && isCorrect
                      ? 'border-emerald-400 bg-emerald-950/40 shadow-[0_0_25px_rgba(16,185,129,0.3)]'
                      : 'border-white/10 bg-dark-900/60'
                  }`}
                >
                  {/* Background Animated Percentage Fill */}
                  <div 
                    className={`absolute left-0 top-0 bottom-0 opacity-20 transition-all duration-700 ease-out ${
                      revealCorrect && isCorrect
                        ? 'bg-emerald-500'
                        : idx === 0
                        ? 'bg-fest-pink'
                        : idx === 1
                        ? 'bg-fest-cyan'
                        : idx === 2
                        ? 'bg-fest-amber'
                        : 'bg-fest-pes'
                    }`}
                    style={{ width: `${pct}%` }}
                  ></div>

                  {/* Option Content */}
                  <div className="relative z-10 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded flex items-center justify-center font-mono text-xs font-bold border ${colorAccents[idx % 4]}`}>
                        {letter}
                      </span>
                      <span className="font-sans font-semibold text-white text-base sm:text-lg">
                        {opt.text}
                      </span>
                      {revealCorrect && isCorrect && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[11px] font-mono font-bold tracking-wider">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          CORRECT ANSWER
                        </span>
                      )}
                    </div>

                    <div className="flex items-baseline gap-2 font-mono">
                      <span className="text-xl sm:text-2xl font-extrabold text-white">
                        {pct}%
                      </span>
                      <span className="text-xs text-slate-400">
                        ({count})
                      </span>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

          {/* Right: Participant QR Code (Col 4) */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center border-t lg:border-t-0 lg:border-l border-white/10 pt-8 lg:pt-0 lg:pl-8">
            <div className="w-full max-w-xs flex flex-col items-center text-center">
              
              <div className="text-xs uppercase font-mono tracking-widest text-fest-pink font-semibold mb-3 flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-fest-pink" />
                Scan To Submit Choice
              </div>

              <div className="p-3.5 bg-white rounded-xl shadow-[0_0_30px_rgba(255,0,122,0.25)] hover:shadow-[0_0_40px_rgba(0,229,255,0.35)] transition-all">
                <QRCodeSVG 
                  value={submissionUrl} 
                  size={190}
                  level="M"
                  includeMargin={false}
                />
              </div>

              <p className="text-xs text-slate-300 font-mono mt-3 leading-relaxed">
                Scan with your phone to open the live voting portal.
              </p>

              <a
                href={submissionUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-xs text-fest-cyan hover:text-fest-pink font-mono transition-colors border-b border-fest-cyan/40 hover:border-fest-pink pb-0.5"
              >
                <span>Direct Link for Laptops</span>
                <ExternalLink className="w-3 h-3" />
              </a>

            </div>
          </div>

        </div>
      )}

    </div>
  );
}
