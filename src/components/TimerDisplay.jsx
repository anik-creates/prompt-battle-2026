import React from 'react';
import { useBattle } from '../context/BattleContext';
import { 
  Clock, 
  Play, 
  Pause, 
  RotateCcw, 
  AlertCircle, 
  CheckCircle,
  Zap
} from 'lucide-react';

export default function TimerDisplay({ size = 'large', showControls = false }) {
  const { 
    timer, 
    startTimer, 
    pauseTimer, 
    resumeTimer, 
    resetTimer 
  } = useBattle();

  const total = timer.duration || 1200;
  const remaining = timer.remaining !== undefined ? timer.remaining : total;
  const progressPercent = Math.max(0, Math.min(100, (remaining / total) * 100));

  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;

  const formattedHours = String(hours).padStart(2, '0');
  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(seconds).padStart(2, '0');

  // Urgency styling when under 2 minutes
  const isUrgent = remaining <= 120 && timer.status === 'running';
  const isCritical = remaining <= 30 && timer.status === 'running';

  return (
    <div className="w-full flex flex-col items-center">
      
      {/* Status Bar */}
      <div className="flex items-center space-x-3 mb-3">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold tracking-widest uppercase transition-all ${
          timer.status === 'running'
            ? isCritical 
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
            : timer.status === 'paused'
            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
            : timer.status === 'finished'
            ? 'bg-red-500/20 text-red-400 border border-red-500/40'
            : 'bg-slate-800 text-slate-400 border border-slate-700'
        }`}>
          {timer.status === 'running' ? (
            <>
              <Zap className="w-3.5 h-3.5 text-fest-cyan animate-bounce" />
              BATTLE IN PROGRESS
            </>
          ) : timer.status === 'paused' ? (
            <>
              <Pause className="w-3.5 h-3.5 text-amber-400" />
              BATTLE PAUSED
            </>
          ) : timer.status === 'finished' ? (
            <>
              <AlertCircle className="w-3.5 h-3.5 text-red-400" />
              TIME EXPIRED
            </>
          ) : (
            <>
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              BATTLE STANDBY
            </>
          )}
        </span>
      </div>

      {/* Main Digital Clock Display (Plain, massive, no card container) */}
      <div className="relative py-4 px-6 md:px-12 flex flex-col items-center justify-center">
        
        {/* Glow ambient background behind the numbers */}
        <div className={`absolute inset-0 blur-3xl pointer-events-none transition-opacity duration-500 ${
          timer.status === 'running' 
            ? isCritical 
              ? 'bg-rose-600/25 opacity-100'
              : 'bg-fest-cyan/15 opacity-100' 
            : 'opacity-0'
        }`}></div>

        {/* Digital Digits */}
        <div className={`relative flex items-baseline font-mono font-extrabold tracking-tight select-none ${
          size === 'large'
            ? 'text-6xl sm:text-7xl md:text-8xl lg:text-9xl'
            : 'text-4xl sm:text-5xl md:text-6xl'
        } ${
          isCritical
            ? 'text-rose-500 animate-pulse'
            : isUrgent
            ? 'text-amber-400'
            : timer.status === 'running'
            ? 'text-white drop-shadow-[0_0_20px_rgba(0,229,255,0.4)]'
            : 'text-slate-300'
        }`}>
          {/* Hours (if applicable) */}
          {hours > 0 && (
            <>
              <span>{formattedHours}</span>
              <span className="mx-1 text-fest-pink opacity-80 animate-pulse">:</span>
            </>
          )}

          {/* Minutes */}
          <span className="tabular-nums">{formattedMinutes}</span>
          
          {/* Separator */}
          <span className={`mx-1 md:mx-2 text-fest-cyan ${timer.status === 'running' ? 'animate-pulse' : 'opacity-60'}`}>
            :
          </span>

          {/* Seconds */}
          <span className="tabular-nums">{formattedSeconds}</span>
        </div>

        {/* Time Units Labels */}
        <div className="flex justify-center space-x-12 sm:space-x-20 text-[11px] sm:text-xs font-mono uppercase tracking-widest text-slate-400 mt-1">
          {hours > 0 && <span>Hours</span>}
          <span>Minutes</span>
          <span>Seconds</span>
        </div>

      </div>

      {/* Sleek Linear Progress Bar (Plain borderless beam) */}
      <div className="w-full max-w-2xl mt-4 px-2">
        <div className="w-full h-2 bg-dark-900 rounded-full overflow-hidden border border-white/10 p-0.5">
          <div 
            className={`h-full rounded-full transition-all duration-300 ${
              isCritical
                ? 'bg-gradient-to-r from-red-600 to-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.7)]'
                : isUrgent
                ? 'bg-gradient-to-r from-amber-500 to-fest-pink shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                : 'bg-gradient-to-r from-fest-cyan via-fest-blue to-fest-pink shadow-[0_0_12px_rgba(0,229,255,0.5)]'
            }`}
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
        <div className="flex justify-between items-center text-[10px] sm:text-xs font-mono text-slate-400 mt-1.5 px-1">
          <span>00:00</span>
          <span>{Math.round(progressPercent)}% Remaining</span>
          <span>
            {String(Math.floor(total / 60)).padStart(2, '0')}:{String(total % 60).padStart(2, '0')} Target
          </span>
        </div>
      </div>

      {/* Optional Timer Controls (Used inside Admin Portal or toggleable) */}
      {showControls && (
        <div className="flex flex-wrap items-center justify-center gap-3 mt-6 pt-4 border-t border-white/10 w-full max-w-xl">
          {timer.status !== 'running' ? (
            <button
              onClick={() => {
                if (timer.status === 'paused') {
                  resumeTimer();
                } else {
                  startTimer();
                }
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-sm font-semibold transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
            >
              <Play className="w-4 h-4 fill-white" />
              {timer.status === 'paused' ? 'Resume Battle' : 'Start Battle Timer'}
            </button>
          ) : (
            <button
              onClick={pauseTimer}
              className="flex items-center gap-2 px-5 py-2.5 rounded bg-amber-600 hover:bg-amber-500 text-white font-mono text-sm font-semibold transition-all shadow-[0_0_15px_rgba(217,119,6,0.3)]"
            >
              <Pause className="w-4 h-4 fill-white" />
              Pause Battle
            </button>
          )}

          <button
            onClick={() => resetTimer()}
            className="flex items-center gap-2 px-4 py-2.5 rounded bg-dark-850 hover:bg-dark-800 border border-white/10 text-slate-300 font-mono text-sm transition-all"
            title="Reset timer to duration"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </div>
      )}

    </div>
  );
}
