import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useBattle } from '../context/BattleContext';
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
  AlertCircle
} from 'lucide-react';

export default function PollArenaView() {
  const { poll } = useBattle();

  const totalVotes = Object.keys(poll?.votes || {}).length;
  const isMcq = poll?.type === 'mcq';
  const isPublished = poll?.published;

  const submissionUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}#poll`
    : 'https://anik-creates.github.io/prompt-battle-2026/#poll';

  return (
    <div className="w-full max-w-6xl mx-auto py-6 sm:py-10 space-y-10">
      
      {/* Header Banner */}
      <div className="text-center relative">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-fest-pink/15 border border-fest-pink/30 text-fest-pink text-xs font-mono tracking-widest uppercase mb-4">
          <Vote className="w-3.5 h-3.5" />
          {isMcq ? 'Live Arena Challenge Question' : 'Live Audience Opinion Poll'}
        </div>

        <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white font-sans tracking-tight max-w-4xl mx-auto leading-snug">
          {poll?.question || 'Awaiting Question from Admin...'}
        </h1>

        <div className="flex items-center justify-center gap-4 mt-4 text-xs font-mono text-slate-400">
          <span className="flex items-center gap-1.5 text-fest-cyan font-bold">
            <Users className="w-3.5 h-3.5" />
            {totalVotes} Total Votes Recorded
          </span>
          <span>•</span>
          <span className={`px-2.5 py-0.5 rounded-full uppercase tracking-wider text-[11px] font-bold ${
            poll?.status === 'active'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse'
              : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
          }`}>
            {poll?.status === 'active' ? 'Voting Live' : 'Voting Concluded'}
          </span>
        </div>
      </div>

      {/* Main Grid: Interactive Animated Results + Scannable QR Code */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center border-y border-white/10 py-10">
        
        {/* Left: Options & Animated Progress Bars (Col 8) */}
        <div className="lg:col-span-8 space-y-4">
          {poll?.options?.map((opt, idx) => {
            const count = opt.votes || 0;
            const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
            const isCorrect = opt.isCorrect;
            const revealCorrect = isMcq && (isPublished || poll?.status === 'closed');

            // Kahoot/EEE Fest distinctive option borders & badges
            const letter = String.fromCharCode(65 + idx); // A, B, C, D
            const colorAccents = [
              'border-fest-pink/40 text-fest-pink bg-fest-pink/10',
              'border-fest-cyan/40 text-fest-cyan bg-fest-cyan/10',
              'border-fest-amber/40 text-fest-amber bg-fest-amber/10',
              'border-fest-pes/40 text-fest-pes bg-fest-pes/10',
            ];

            return (
              <div 
                key={opt.id}
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
              Scan To Cast Your Vote
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
              Scan with your phone to open the locked voting portal.
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

    </div>
  );
}
