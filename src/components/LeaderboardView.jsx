import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useBattle } from '../context/BattleContext';
import { 
  Trophy, 
  Award, 
  Medal, 
  Clock, 
  Cpu, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  Star,
  Users,
  MapPin
} from 'lucide-react';

export default function LeaderboardView() {
  const { participants } = useBattle();

  // Sort participants by total score (descending), then by finish time (ascending)
  const sorted = [...participants].sort((a, b) => {
    const scoreDiff = (b.totalScore || 0) - (a.totalScore || 0);
    if (scoreDiff !== 0) return scoreDiff;
    return (a.finishSeconds || 999999) - (b.finishSeconds || 999999);
  });

  // Fire celebratory cyber confetti on mount
  useEffect(() => {
    try {
      const end = Date.now() + 1.5 * 1000;
      const colors = ['#00e5ff', '#ff007a', '#ffb700', '#6cb33f'];

      (function frame() {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();
    } catch (e) {
      console.warn(e);
    }
  }, []);

  return (
    <div className="w-full max-w-7xl mx-auto py-6">
      
      {/* Header Banner */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-fest-pink/10 border border-fest-pink/30 text-fest-pink text-xs font-mono uppercase tracking-widest mb-3">
          <Trophy className="w-3.5 h-3.5 text-fest-amber" />
          Official Battle Results Published
        </div>
        
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white font-sans">
          PROMPT BATTLE <span className="text-fest-gradient">LEADERBOARD</span>
        </h2>
        <p className="text-sm text-slate-400 font-mono mt-2 flex items-center justify-center gap-2">
          <span>EEE FEST 2026</span>
          <span>•</span>
          <span className="text-fest-pes font-semibold">IEEE PES DIU SBC</span>
          <span>•</span>
          <span>Final Grand Standing</span>
        </p>
      </div>

      {sorted.length === 0 ? (
        <div className="py-20 text-center border-y border-white/10 font-mono text-slate-400">
          <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-3" />
          No participants scored yet. Check back once scores are published.
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* Top 3 Podium Highlights (Plain, minimal border rows, no bulky cards) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sorted.slice(0, 3).map((p, idx) => {
              const rank = idx + 1;
              const isFirst = rank === 1;
              const isSecond = rank === 2;
              const isThird = rank === 3;

              const borderGlow = isFirst
                ? 'border-fest-amber/50 shadow-[0_0_25px_rgba(255,183,0,0.15)] bg-gradient-to-b from-fest-amber/10 via-dark-900 to-dark-950'
                : isSecond
                ? 'border-slate-300/40 shadow-[0_0_20px_rgba(203,213,225,0.1)] bg-gradient-to-b from-slate-300/10 via-dark-900 to-dark-950'
                : 'border-amber-700/50 shadow-[0_0_20px_rgba(180,83,9,0.1)] bg-gradient-to-b from-amber-700/10 via-dark-900 to-dark-950';

              const badgeColor = isFirst
                ? 'text-fest-amber border-fest-amber/40 bg-fest-amber/10'
                : isSecond
                ? 'text-slate-200 border-slate-300/40 bg-slate-300/10'
                : 'text-amber-500 border-amber-600/40 bg-amber-600/10';

              return (
                <div 
                  key={p.id} 
                  className={`relative p-6 rounded-lg border transition-all ${borderGlow} ${isFirst ? 'md:-translate-y-2' : ''}`}
                >
                  {/* Top Rank Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider border ${badgeColor}`}>
                      {isFirst ? (
                        <Trophy className="w-3.5 h-3.5 fill-current" />
                      ) : (
                        <Medal className="w-3.5 h-3.5 fill-current" />
                      )}
                      RANK #{rank} {isFirst ? 'CHAMPION' : isSecond ? '1ST RUNNER UP' : '2ND RUNNER UP'}
                    </span>
                    <span className="text-2xl font-mono font-extrabold text-white">
                      {p.totalScore || 0} <span className="text-xs text-slate-400 font-normal">PTS</span>
                    </span>
                  </div>

                  {/* Participant & Team */}
                  <h3 className="text-xl font-bold text-white tracking-tight truncate flex items-center gap-1.5 flex-wrap">
                    {p.participantId && (
                      <span className="px-1.5 py-0.5 rounded bg-fest-cyan/20 border border-fest-cyan/40 text-fest-cyan font-mono text-[10px] font-bold shrink-0">
                        {p.participantId}
                      </span>
                    )}
                    {p.deskNumber && (
                      <span className="px-1.5 py-0.5 rounded bg-fest-amber/15 border border-fest-amber/40 text-fest-amber font-mono text-[10px] font-bold shrink-0 flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5 text-fest-amber" />
                        <span>{p.deskNumber}</span>
                      </span>
                    )}
                    <span className="truncate">{p.name}</span>
                  </h3>
                  <p className="text-xs text-fest-cyan font-mono truncate mt-0.5 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {p.teamName}
                  </p>

                  {/* Factor Breakdown */}
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-white/10 text-xs font-mono">
                    <div className="text-slate-400">
                      Finish Time: <span className="text-white font-semibold">{p.finishTimeFormatted || 'N/A'}</span>
                    </div>
                    <div className="text-slate-400">
                      Tokens: <span className="text-white font-semibold">{p.tokensUsed || 0}</span>
                    </div>
                    <div className="text-slate-400">
                      Objective: <span className="text-fest-cyan font-semibold">{p.objectiveScore || 0}/30</span>
                    </div>
                    <div className="text-slate-400">
                      Novelty: <span className="text-fest-pink font-semibold">{p.noveltyScore || 0}/25</span>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className="mt-3 text-[11px] font-mono text-slate-400 truncate">
                    Status: <span className="text-emerald-400 font-semibold">{p.finishStatus}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Full Plain Data Table (Sleek, transparent, responsive horizontal scroll) */}
          <div className="overflow-x-auto border-y border-white/10 scrollbar-thin">
            <table className="w-full min-w-[850px] text-left font-mono text-xs">
              <thead className="bg-dark-900/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-white/10">
                <tr>
                  <th className="py-4 px-4">Rank</th>
                  <th className="py-4 px-4 font-sans font-bold">Contender / Team</th>
                  <th className="py-4 px-4">Finish Time</th>
                  <th className="py-4 px-4">Tokens</th>
                  <th className="py-4 px-4">Objective (30)</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4">Presentation (25)</th>
                  <th className="py-4 px-4">Novelty (25)</th>
                  <th className="py-4 px-4 text-right font-bold text-slate-200">Total (100)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sorted.map((p, idx) => {
                  const rank = idx + 1;
                  return (
                    <tr 
                      key={p.id}
                      className={`hover:bg-white/[0.02] transition-colors ${
                        rank <= 3 ? 'bg-white/[0.015]' : ''
                      }`}
                    >
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded text-xs font-bold ${
                          rank === 1
                            ? 'bg-fest-amber/20 text-fest-amber border border-fest-amber/40'
                            : rank === 2
                            ? 'bg-slate-300/20 text-slate-200 border border-slate-300/40'
                            : rank === 3
                            ? 'bg-amber-600/20 text-amber-500 border border-amber-600/40'
                            : 'text-slate-400'
                        }`}>
                          {rank}
                        </span>
                      </td>

                      <td className="py-4 px-4 font-sans">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {p.participantId && (
                            <span className="px-1.5 py-0.5 rounded bg-fest-cyan/20 border border-fest-cyan/40 text-fest-cyan font-mono text-[10px] font-bold shrink-0">
                              {p.participantId}
                            </span>
                          )}
                          {p.deskNumber && (
                            <span className="px-1.5 py-0.5 rounded bg-fest-amber/15 border border-fest-amber/40 text-fest-amber font-mono text-[10px] font-bold shrink-0 flex items-center gap-1">
                              <MapPin className="w-2.5 h-2.5 text-fest-amber" />
                              <span>{p.deskNumber}</span>
                            </span>
                          )}
                          <span className="font-bold text-white text-sm">{p.name}</span>
                          {p.tabSwitches > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-mono text-[10px] font-bold border border-rose-500/40">
                              ⚠️ {p.tabSwitches} switches
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-fest-cyan font-mono">{p.teamName}</div>
                      </td>

                      <td className="py-4 px-4 font-semibold text-slate-300">
                        {p.finishTimeFormatted || 'N/A'}
                      </td>

                      <td className="py-4 px-4 text-slate-300">
                        {p.tokensUsed ? p.tokensUsed.toLocaleString() : '0'}
                      </td>

                      <td className="py-4 px-4 text-fest-cyan font-semibold">
                        {p.objectiveScore || 0}
                      </td>

                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${
                          p.finishStatus === 'Fully Completed'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : p.finishStatus === 'Substantially Completed'
                            ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                            : p.finishStatus === 'Partially Fulfilled'
                            ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                          {p.finishStatus}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-slate-300">
                        {p.presentationScore || 0}
                      </td>

                      <td className="py-4 px-4 text-fest-pink font-semibold">
                        {p.noveltyScore || 0}
                      </td>

                      <td className="py-4 px-4 text-right">
                        <span className="text-base font-bold text-white font-mono">
                          {p.totalScore || 0}
                        </span>
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
  );
}
