import React, { useState, useEffect } from 'react';
import { useBattle } from '../context/BattleContext';
import { ShieldCheck, User, Users, Key, AlertCircle, ArrowRight, LogOut, CheckCircle2, MapPin } from 'lucide-react';

export default function ContenderAuthGate({ children, onAuthenticated, isSimulator = false }) {
  const { registeredContenders = [], registerPresence, activeArena } = useBattle();

  const [session, setSession] = useState(() => {
    try {
      const saved = localStorage.getItem('pb_contender_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [showDeskScreen, setShowDeskScreen] = useState(false);
  const [idInput, setIdInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [teamInput, setTeamInput] = useState('');
  const [deskInput, setDeskInput] = useState('');
  const [error, setError] = useState('');
  const [matchedContender, setMatchedContender] = useState(null);

  // When ID input changes, check if it matches a pre-registered contender
  useEffect(() => {
    const trimmed = idInput.trim().toUpperCase();
    if (!trimmed) {
      setMatchedContender(null);
      return;
    }

    const match = (registeredContenders || []).find(
      (c) => c.participantId?.toUpperCase() === trimmed
    );

    if (match) {
      setMatchedContender(match);
      setNameInput(match.name || '');
      setTeamInput(match.teamName || '');
      setDeskInput(match.deskNumber || '');
      setError('');
    } else {
      setMatchedContender(null);
    }
  }, [idInput, registeredContenders]);

  // When session is active, notify parent and maintain live presence heartbeat (every 20s)
  useEffect(() => {
    if (isSimulator) return; // Do not count admin simulator as a live mobile participant

    if (session) {
      if (onAuthenticated) onAuthenticated(session);
      const ping = () => {
        registerPresence({
          participantId: session.participantId,
          name: session.name,
          teamName: session.teamName,
          deskNumber: session.deskNumber,
          arena: activeArena,
        });
      };
      ping();
      const interval = setInterval(ping, 20000);
      return () => clearInterval(interval);
    }
  }, [session, isSimulator, onAuthenticated, registerPresence, activeArena]);

  const handleLogin = (e) => {
    e.preventDefault();
    const cleanId = idInput.trim().toUpperCase();
    const cleanName = nameInput.trim();

    if (!cleanId) {
      setError('Please provide your official Participant ID.');
      return;
    }

    if (!cleanName) {
      setError('Please provide your Full Name.');
      return;
    }

    const assignedDesk = deskInput.trim() || matchedContender?.deskNumber || 'Desk 01';

    const contenderData = {
      participantId: cleanId,
      name: cleanName,
      teamName: teamInput.trim() || matchedContender?.teamName || 'Solo Contender',
      deskNumber: assignedDesk,
      loggedInAt: Date.now(),
    };

    try {
      localStorage.setItem('pb_contender_session', JSON.stringify(contenderData));
    } catch (e) {
      console.warn(e);
    }

    setSession(contenderData);
    setShowDeskScreen(true);
    setError('');
  };

  const handleLogout = () => {
    if (window.confirm('Switch Contender ID? Any in-progress answers on this device will reset.')) {
      localStorage.removeItem('pb_contender_session');
      setSession(null);
      setShowDeskScreen(false);
      setIdInput('');
      setNameInput('');
      setTeamInput('');
      setDeskInput('');
      setMatchedContender(null);
    }
  };

  // If user is not authenticated yet, show Login Gate
  if (!session) {
    return (
      <div className="w-full max-w-md mx-auto py-8 px-4 font-mono">
        <div className="p-6 sm:p-8 rounded-2xl bg-dark-900 border border-white/15 shadow-[0_0_50px_rgba(0,0,0,0.8)] space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-fest-pink/15 border border-fest-pink/30 text-fest-pink flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(255,0,122,0.3)]">
              <Key className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold font-sans text-white uppercase tracking-tight">
              Contender Portal Login
            </h2>
            <p className="text-xs text-slate-400">
              Enter your official Participant ID provided by the IEEE PES DIU SBC Organizer
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            {error && (
              <div className="p-3 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-slate-300 font-bold mb-1">
                Participant ID *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={idInput}
                  onChange={(e) => setIdInput(e.target.value)}
                  placeholder="e.g. PB-101"
                  className="w-full px-3 py-2.5 rounded bg-dark-950 border border-white/15 text-fest-cyan font-bold font-mono text-sm focus:border-fest-cyan uppercase"
                />
                {matchedContender && (
                  <span className="absolute right-3 top-3 text-emerald-400 flex items-center gap-1 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verified</span>
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Provided on your desk badge or registration slip.
              </p>
            </div>

            {matchedContender ? (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 space-y-1">
                <div className="flex justify-between font-bold">
                  <span>Name:</span>
                  <span className="text-white">{matchedContender.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Team:</span>
                  <span className="text-fest-pink">{matchedContender.teamName || 'Solo'}</span>
                </div>
                {matchedContender.deskNumber && (
                  <div className="flex justify-between text-[11px] text-slate-300">
                    <span>Station:</span>
                    <span className="text-fest-cyan">{matchedContender.deskNumber}</span>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Contender Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="e.g. Shakib Ahmed"
                    className="w-full px-3 py-2 rounded bg-dark-950 border border-white/15 text-white font-sans text-sm focus:border-fest-pink"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Team Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={teamInput}
                    onChange={(e) => setTeamInput(e.target.value)}
                    placeholder="e.g. DIU Sparks"
                    className="w-full px-3 py-2 rounded bg-dark-950 border border-white/15 text-white text-xs focus:border-fest-cyan"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              className="w-full py-3 px-4 rounded bg-gradient-to-r from-fest-pink to-fest-cyan text-white font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(255,0,122,0.35)] flex items-center justify-center gap-2 hover:opacity-95"
            >
              <span>Enter Competition Arena</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {registeredContenders.length > 0 && (
            <div className="pt-2 border-t border-white/10 text-center text-[10px] text-slate-400">
              <span>{registeredContenders.length} Contenders Registered by IEEE PES DIU SBC</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // If user just logged in or clicked their desk button, show the Designated Desk Card
  if (session && showDeskScreen) {
    return (
      <div className="w-full max-w-md mx-auto py-6 px-3 sm:px-4 font-mono text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-dark-900 via-dark-950 to-dark-950 border-2 border-fest-amber/50 shadow-[0_0_60px_rgba(255,183,0,0.3)] space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-fest-amber/20 border-2 border-fest-amber/40 text-fest-amber flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(255,183,0,0.5)]">
            <MapPin className="w-8 h-8 text-fest-amber" />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-fest-cyan uppercase tracking-widest px-3 py-1 rounded-full bg-fest-cyan/15 border border-fest-cyan/30 inline-block">
              Official Contender Verified
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-sans text-white mt-2">
              Welcome, {session.name}!
            </h2>
            <p className="text-xs text-slate-400">
              IEEE PES DIU SBC • Prompt Battle 2026
            </p>
          </div>

          {/* Large Glowing Designated Desk Station Card */}
          <div className="p-6 rounded-2xl bg-dark-950/90 border-2 border-fest-amber/40 shadow-inner space-y-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2 w-16 h-16 bg-fest-amber/10 rounded-full blur-xl pointer-events-none"></div>
            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block">
              YOUR ASSIGNED DESK STATION
            </span>
            <div className="text-4xl sm:text-5xl font-black font-sans text-fest-amber tracking-tight drop-shadow-[0_0_20px_rgba(255,183,0,0.6)] py-1">
              {session.deskNumber || 'Desk 01'}
            </div>
            <div className="flex items-center justify-center gap-2 pt-1 text-xs text-slate-300">
              <span className="px-2 py-0.5 rounded bg-fest-cyan/15 text-fest-cyan border border-fest-cyan/30 font-bold">
                {session.participantId}
              </span>
              <span className="text-white/20">•</span>
              <span className="text-fest-pink font-semibold">
                {session.teamName || 'Solo'}
              </span>
            </div>
          </div>

          {/* Instruction Note */}
          <div className="p-3.5 rounded-xl bg-fest-pes/10 border border-fest-pes/30 text-fest-pes text-xs text-left flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-fest-pes" />
            <p className="text-[11px] leading-relaxed text-slate-300">
              Please take your seat at <strong className="text-fest-amber">{session.deskNumber || 'your designated desk'}</strong>. Your station will be visited by organizers for prompt verification and grading.
            </p>
          </div>

          {/* Action button to proceed to battle */}
          <button
            onClick={() => setShowDeskScreen(false)}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-fest-amber via-fest-pes to-fest-cyan text-dark-950 font-bold font-sans uppercase tracking-wider shadow-[0_0_25px_rgba(255,183,0,0.4)] flex items-center justify-center gap-2 hover:opacity-95 transition-all text-xs"
          >
            <span>Proceed to Competition Arena</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Contender is Authenticated: render active top profile bar & children
  return (
    <div className="w-full space-y-4">
      {/* Contender Identification Banner */}
      <div className="w-full p-2.5 sm:p-3 rounded-xl bg-dark-900 border border-white/15 flex flex-wrap items-center justify-between gap-3 text-xs font-mono shadow-sm">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="px-2 py-0.5 rounded bg-fest-cyan/20 border border-fest-cyan/40 text-fest-cyan font-bold tracking-wider shrink-0">
            {session.participantId}
          </span>
          <div className="truncate">
            <span className="font-bold text-white font-sans mr-2">{session.name}</span>
            <span className="text-fest-pink text-[11px]">({session.teamName || 'Solo'})</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Designated Desk Pill (Clickable) */}
          <button
            type="button"
            onClick={() => setShowDeskScreen(true)}
            className="px-2.5 py-1 rounded-lg bg-fest-amber/15 border border-fest-amber/40 text-fest-amber font-bold text-[11px] flex items-center gap-1.5 hover:bg-fest-amber/25 transition-all shadow-[0_0_10px_rgba(255,183,0,0.2)]"
            title="Click to view assigned desk station"
          >
            <MapPin className="w-3.5 h-3.5 text-fest-amber animate-pulse" />
            <span>{session.deskNumber || 'Desk 01'}</span>
          </button>

          <span className="hidden sm:inline-flex items-center gap-1.5 text-emerald-400 text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Online</span>
          </span>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-dark-950 border border-white/10 text-slate-400 hover:text-white transition-colors text-[11px]"
            title="Switch Contender Account"
          >
            <LogOut className="w-3 h-3" />
            <span>Switch ID</span>
          </button>
        </div>
      </div>

      {/* Render Portal Views with session passed to children */}
      {typeof children === 'function' ? children(session) : children}
    </div>
  );
}
