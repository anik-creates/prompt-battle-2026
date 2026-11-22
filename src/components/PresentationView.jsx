import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useBattle } from '../context/BattleContext';
import TimerDisplay from './TimerDisplay';
import LeaderboardView from './LeaderboardView';
import PollArenaView from './PollArenaView';
import QuizArenaView from './QuizArenaView';
import { 
  QrCode, 
  Clock, 
  Users, 
  CheckCircle, 
  ExternalLink, 
  Sparkles, 
  Terminal,
  Activity,
  Flame,
  Vote,
  HelpCircle,
  MapPin
} from 'lucide-react';

export default function PresentationView() {
  const { 
    activeArena,
    timer, 
    participants, 
    published,
    totalJoinedCount,
    problemStatement = {}
  } = useBattle();

  // If active arena is Live Poll or Kahoot Quiz, render those arenas
  if (activeArena === 'poll') {
    return <PollArenaView />;
  }

  if (activeArena === 'quiz') {
    return <QuizArenaView />;
  }

  // If Admin has published the Leaderboard in Battle mode, show Leaderboard View
  if (published) {
    return <LeaderboardView />;
  }

  // Compute clean submission portal URL
  const basePath = typeof window !== 'undefined' && window.location.pathname.startsWith('/prompt-battle-2026') ? '/prompt-battle-2026' : '';
  const submissionUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${basePath}/submit`
    : 'https://anik-creates.github.io/prompt-battle-2026/submit';

  return (
    <div className="w-full max-w-7xl mx-auto py-6 sm:py-8 space-y-12">
      
      {/* Hero Section */}
      <div className="text-center relative">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-fest-cyan/10 border border-fest-cyan/30 text-fest-cyan text-xs font-mono tracking-widest uppercase mb-4">
          <Activity className="w-3.5 h-3.5 animate-pulse" />
          Live AI Prompt Engineering Arena
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white font-sans">
          PROMPT <span className="text-fest-gradient">BATTLE</span>
        </h1>
        
        <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-400 font-mono mt-3 leading-relaxed">
          EEE FEST 2026 • Organized by <span className="text-fest-pes font-semibold">IEEE PES DIU Student Branch Chapter</span>
        </p>
      </div>

      {/* Main Arena Grid: Big Timer + Scannable QR Code */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center border-y border-white/10 py-10">
        
        {/* Left: Big Timer (Col 8) */}
        <div className="lg:col-span-8 flex flex-col items-center justify-center">
          <div className="text-xs uppercase font-mono tracking-widest text-slate-400 mb-2 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-fest-cyan" />
            Official Challenge Clock
          </div>

          <TimerDisplay size="large" showControls={false} />
          
          <div className="mt-4 text-xs font-mono text-slate-400 text-center flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-fest-pink"></span>
              Synchronized Live Across All Devices
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="text-fest-cyan">Time recorded at instant of finish</span>
          </div>
        </div>

        {/* Right: Participant QR Code (Col 4) */}
        <div className="lg:col-span-4 flex flex-col items-center lg:items-end justify-center border-t lg:border-t-0 lg:border-l border-white/10 pt-8 lg:pt-0 lg:pl-8">
          
          <div className="w-full max-w-xs flex flex-col items-center text-center">
            
            <div className="text-xs uppercase font-mono tracking-widest text-fest-pink font-semibold mb-3 flex items-center gap-1.5">
              <QrCode className="w-4 h-4 text-fest-pink" />
              Scan To Submit Solution
            </div>

            <div className="p-3.5 bg-white rounded-xl shadow-[0_0_30px_rgba(0,229,255,0.25)] hover:shadow-[0_0_40px_rgba(255,0,122,0.35)] transition-all">
              <QRCodeSVG 
                value={submissionUrl} 
                size={200}
                level="M"
                includeMargin={false}
              />
            </div>

            <p className="text-xs text-slate-300 font-mono mt-3 leading-relaxed">
              Scan with your phone camera to record your team's finish time.
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

      {/* Official Challenge Spotlight (when released by Admin) */}
      {problemStatement.status === 'released' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-dark-900 via-dark-950 to-dark-900 border-2 border-fest-cyan/40 shadow-[0_0_50px_rgba(0,229,255,0.2)] space-y-4 font-mono">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30">
                Official Challenge Broadcast Active
              </span>
            </div>
            {problemStatement.track && (
              <span className="text-xs text-fest-cyan font-bold px-3 py-1 rounded-full bg-fest-cyan/15 border border-fest-cyan/30">
                {problemStatement.track}
              </span>
            )}
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold font-sans text-white">
              {problemStatement.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans max-w-4xl">
              {problemStatement.scenario}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-xs">
            <div className="p-4 rounded-xl bg-dark-950 border border-white/10 space-y-1.5">
              <span className="text-[11px] font-bold uppercase text-fest-cyan tracking-wider block">
                Core Objective
              </span>
              <p className="text-slate-300 whitespace-pre-line leading-relaxed">
                {problemStatement.objective}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-dark-950 border border-fest-pink/30 space-y-1.5">
              <span className="text-[11px] font-bold uppercase text-fest-pink tracking-wider block">
                Key Constraint Highlights
              </span>
              <ul className="space-y-1 text-slate-300">
                {(problemStatement.constraints || []).slice(0, 3).map((c, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-fest-pink">•</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Submitted Participants Live Stream */}
      <div className="space-y-4">
        
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-fest-cyan" />
            <h2 className="text-lg font-bold font-sans tracking-wide text-white uppercase">
              Submitted Contenders
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-dark-900 border border-white/10 text-xs font-mono text-fest-cyan font-bold">
              {participants.length} Finished / {Math.max(participants.length, totalJoinedCount)} Connected
            </span>
          </div>

          <div className="text-xs font-mono text-slate-400">
            Real-Time Feed
          </div>
        </div>

        {participants.length === 0 ? (
          <div className="py-16 text-center font-mono text-slate-400 border border-dashed border-white/10 rounded-lg">
            <Terminal className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm">Waiting for participants to submit work...</p>
            <p className="text-xs text-slate-400 mt-1">
              Contenders who click "I Have Finished" will appear here instantaneously with their recorded time.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5 border border-white/10 rounded-lg overflow-hidden bg-dark-900/40">
            {participants.map((p, idx) => (
              <div 
                key={p.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-start sm:items-center space-x-4">
                  <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded bg-dark-800 border border-white/10 font-mono text-xs font-bold text-fest-cyan">
                    #{idx + 1}
                  </span>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {p.participantId && (
                        <span className="px-2 py-0.5 rounded bg-fest-cyan/20 border border-fest-cyan/40 text-fest-cyan font-mono text-xs font-bold shrink-0">
                          {p.participantId}
                        </span>
                      )}
                      {p.deskNumber && (
                        <span className="px-2 py-0.5 rounded bg-fest-amber/20 border border-fest-amber/40 text-fest-amber font-mono text-xs font-bold shrink-0 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-fest-amber" />
                          <span>{p.deskNumber}</span>
                        </span>
                      )}
                      <span className="font-bold text-base text-white font-sans tracking-tight">
                        {p.name}
                      </span>
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      {p.tabSwitches > 0 && (
                        <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-mono text-[10px] font-bold border border-rose-500/40">
                          ⚠️ {p.tabSwitches} switches
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-fest-pink font-mono">
                      {p.teamName}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-6 text-xs font-mono">
                  <div className="flex flex-col sm:items-end">
                    <span className="text-[11px] text-slate-400 uppercase tracking-wider">
                      Antigravity Limit
                    </span>
                    <span className="text-sm font-bold text-fest-pink">
                      {p.tokensUsed || 0}% ({p.tokenScore !== undefined ? p.tokenScore : 15} pts)
                    </span>
                  </div>

                  <div className="flex flex-col sm:items-end">
                    <span className="text-[11px] text-slate-400 uppercase tracking-wider">
                      Time Recorded
                    </span>
                    <span className="text-sm font-bold text-fest-cyan">
                      {p.finishTimeFormatted || 'Recorded'}
                    </span>
                  </div>

                  <div className="hidden md:flex flex-col sm:items-end">
                    <span className="text-[11px] text-slate-400 uppercase tracking-wider">
                      Timestamp
                    </span>
                    <span className="text-slate-300">
                      {new Date(p.submittedAt).toLocaleTimeString()}
                    </span>
                  </div>

                  <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-medium">
                    Received
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

    </div>
  );
}
