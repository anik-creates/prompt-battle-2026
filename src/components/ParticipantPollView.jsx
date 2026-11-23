import React, { useState, useEffect, useRef } from 'react';
import { useBattle, toSafeArray, DEFAULT_POLL } from '../context/BattleContext';
import { 
  Vote, 
  CheckCircle2, 
  User, 
  ShieldAlert, 
  AlertTriangle, 
  Sparkles,
  Lock,
  Clock
} from 'lucide-react';

export default function ParticipantPollView({ isSimulator = false }) {
  const { poll, submitVote, registerPresence } = useBattle();

  const safePoll = poll || DEFAULT_POLL;
  const optionsList = toSafeArray(safePoll.options, DEFAULT_POLL.options);

  const session = (() => {
    try {
      const saved = localStorage.getItem('pb_contender_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  })();

  const [voterName, setVoterName] = useState(() => {
    return session?.name || localStorage.getItem('pb_voter_name') || '';
  });
  const [selectedOptId, setSelectedOptId] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const questionStartTimeRef = useRef(Date.now());

  const participantId = session?.participantId || useState(() => {
    let id = localStorage.getItem('pb_participant_uuid');
    if (!id) {
      id = `voter-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      localStorage.setItem('pb_participant_uuid', id);
    }
    return id;
  })[0];

  // Detect whether already voted in this poll
  useEffect(() => {
    if (safePoll?.votes && safePoll.votes[participantId]) {
      setHasVoted(true);
      setSelectedOptId(safePoll.votes[participantId].optionId);
    }
  }, [safePoll, participantId]);

  // Maintain live presence heartbeat (every 20s)
  useEffect(() => {
    if (isSimulator) return;

    const ping = () => {
      registerPresence({
        participantId,
        name: voterName || 'Contender',
        teamName: 'Solo',
        arena: 'poll',
      });
    };
    ping();
    const interval = setInterval(ping, 20000);
    return () => clearInterval(interval);
  }, [isSimulator, participantId, registerPresence, voterName]);

  const handleCastVote = (optId) => {
    if (hasVoted) return;
    if (safePoll?.status === 'closed') {
      setErrorMsg('This poll has been concluded by the moderator.');
      return;
    }

    const nameToSave = voterName.trim() || 'Contender';
    localStorage.setItem('pb_voter_name', nameToSave);

    const timeTakenSec = Math.max(1, Math.round((Date.now() - questionStartTimeRef.current) / 1000));

    const res = submitVote({
      participantId,
      participantName: nameToSave,
      teamName: session?.teamName || 'Solo Contender',
      optionId: optId,
      timeTakenSec,
    });

    if (res.success) {
      setSelectedOptId(optId);
      setHasVoted(true);
      setErrorMsg('');
    } else {
      setErrorMsg(res.error || 'Failed to submit vote.');
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto py-6 px-4 space-y-6">
      
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-fest-pink/15 border border-fest-pink/30 text-fest-pink text-xs font-mono uppercase tracking-wider mb-2">
          <Vote className="w-3.5 h-3.5" />
          Live Participant Voting
        </div>
        <h2 className="text-xl sm:text-2xl font-bold font-sans text-white">
          {safePoll.question || 'Awaiting Question...'}
        </h2>
      </div>

      {errorMsg && (
        <div className="p-3 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Optional Name Identifier Input */}
      {!hasVoted && (
        <div className="space-y-1.5">
          <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-fest-cyan" />
            Your Contender Name (Optional)
          </label>
          <input
            type="text"
            value={voterName}
            onChange={(e) => setVoterName(e.target.value)}
            placeholder="e.g. Tanvir / Solo"
            className="w-full px-3 py-2 rounded bg-dark-950 border border-white/10 text-white text-xs font-mono focus:border-fest-cyan"
          />
        </div>
      )}

      {/* Options List */}
      <div className="space-y-3">
        {optionsList.map((opt, idx) => {
          const isSelected = selectedOptId === opt.id;
          const letter = String.fromCharCode(65 + idx);

          return (
            <button
              key={opt.id || idx}
              disabled={hasVoted || safePoll.status === 'closed'}
              onClick={() => handleCastVote(opt.id)}
              className={`w-full p-4 rounded-xl border text-left transition-all duration-200 flex items-center justify-between group ${
                isSelected
                  ? 'border-emerald-400 bg-emerald-950/40 ring-1 ring-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.25)]'
                  : hasVoted
                  ? 'border-white/5 bg-dark-950/30 opacity-60'
                  : 'border-white/10 bg-dark-900/80 hover:border-fest-cyan/40 hover:bg-dark-850 active:scale-[0.98]'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className={`w-8 h-8 rounded flex items-center justify-center font-mono text-xs font-bold border ${
                  isSelected ? 'bg-emerald-500 text-dark-950 border-emerald-400' : 'bg-dark-800 text-slate-300 border-white/10'
                }`}>
                  {letter}
                </span>
                <span className="font-sans font-medium text-white text-sm sm:text-base">
                  {opt.text}
                </span>
              </div>

              {isSelected && (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Vote Recorded Confirmation */}
      {hasVoted && (
        <div className="p-4 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-center space-y-1 font-mono">
          <div className="text-emerald-400 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            Vote Locked & Broadcasted!
          </div>
          <p className="text-[11px] text-slate-400">
            Look up at the presentation screen for the live result distribution.
          </p>
        </div>
      )}

    </div>
  );
}
