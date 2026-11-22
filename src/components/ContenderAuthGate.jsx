import React, { useState, useEffect } from 'react';
import { useBattle } from '../context/BattleContext';
import { 
  ShieldCheck, 
  User, 
  Users, 
  Key, 
  AlertCircle, 
  ArrowRight, 
  LogOut, 
  CheckCircle2, 
  MapPin, 
  Mail, 
  Eye, 
  EyeOff,
  Sparkles
} from 'lucide-react';

export default function ContenderAuthGate({ children, onAuthenticated, isSimulator = false }) {
  const { 
    registeredContenders = [], 
    authenticateContender,
    registerPresence, 
    activeArena 
  } = useBattle();

  const [session, setSession] = useState(() => {
    try {
      const saved = localStorage.getItem('pb_contender_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [showDeskScreen, setShowDeskScreen] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [passcodeInput, setPasscodeInput] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [error, setError] = useState('');

  // When session is active, notify parent and maintain live presence heartbeat (every 20s)
  useEffect(() => {
    if (isSimulator) return; // Do not count admin simulator as a live mobile participant

    if (session) {
      if (onAuthenticated) onAuthenticated(session);
      const ping = () => {
        registerPresence({
          participantId: session.participantId,
          name: session.name,
          email: session.email,
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
    setError('');

    const cleanEmail = emailInput.trim().toLowerCase();
    const cleanPasscode = passcodeInput.trim();

    if (!cleanEmail) {
      setError('Please provide your official registered Email address.');
      return;
    }

    if (!cleanPasscode) {
      setError('Please provide the unique passcode sent to your mail.');
      return;
    }

    // Authenticate via context
    const res = authenticateContender(cleanEmail, cleanPasscode);

    if (res.success && res.contender) {
      const match = res.contender;
      const contenderData = {
        participantId: match.participantId || 'PB-CONTENDER',
        name: match.name || cleanEmail.split('@')[0],
        email: cleanEmail,
        teamName: match.teamName || 'Solo Contender',
        deskNumber: match.deskNumber || 'Desk 01',
        loggedInAt: Date.now(),
      };

      try {
        localStorage.setItem('pb_contender_session', JSON.stringify(contenderData));
      } catch (err) {
        console.warn(err);
      }

      setSession(contenderData);
      setShowDeskScreen(true);
      setError('');
    } else {
      // If roster is empty or not found, check if user is using direct fallback
      if (registeredContenders.length === 0) {
        setError('No contenders have been registered in the system yet. Please ask the organizers to upload the official roster sheet.');
      } else {
        setError(res.error || 'Invalid Email or Passcode. Please verify the credentials sent to your mail.');
      }
    }
  };

  const handleQuickFill = (c) => {
    if (!c) return;
    setEmailInput(c.email || `${c.participantId?.toLowerCase()}@diu.edu.bd`);
    setPasscodeInput(c.passcode || c.password || 'PASS-9821');
    setError('');
  };

  const handleLogout = () => {
    if (window.confirm('Switch Contender Account? Any in-progress answers on this device will reset.')) {
      localStorage.removeItem('pb_contender_session');
      setSession(null);
      setShowDeskScreen(false);
      setEmailInput('');
      setPasscodeInput('');
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
              Contender Login
            </h2>
            <p className="text-xs text-slate-400">
              Enter your registered Email & unique Passcode provided in your mail by IEEE PES DIU SBC
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            {error && (
              <div className="p-3 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-slate-300 font-bold mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-fest-cyan" />
                <span>Email Address *</span>
              </label>
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="e.g. contender@diu.edu.bd"
                className="w-full px-3 py-2.5 rounded bg-dark-950 border border-white/15 text-white font-mono text-sm focus:border-fest-cyan"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                The email you registered with for Prompt Battle 2026.
              </p>
            </div>

            {/* Passcode Field */}
            <div>
              <label className="block text-slate-300 font-bold mb-1 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-fest-pink" />
                <span>Unique Passcode *</span>
              </label>
              <div className="relative">
                <input
                  type={showPasscode ? 'text' : 'password'}
                  required
                  value={passcodeInput}
                  onChange={(e) => setPasscodeInput(e.target.value)}
                  placeholder="Enter passcode from your email..."
                  className="w-full px-3 py-2.5 rounded bg-dark-950 border border-white/15 text-fest-pink font-bold font-mono text-sm focus:border-fest-pink"
                />
                <button
                  type="button"
                  onClick={() => setShowPasscode(!showPasscode)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                >
                  {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Secret code provided via email by the event organizers.
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded bg-gradient-to-r from-fest-pink to-fest-cyan text-white font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(255,0,122,0.35)] flex items-center justify-center gap-2 hover:opacity-95"
            >
              <span>Verify & Enter Arena</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Helper for Testing or Roster Preview */}
          {registeredContenders.length > 0 ? (
            <div className="pt-3 border-t border-white/10 text-left space-y-2">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-fest-amber" />
                <span>Registered Contenders on Roster ({registeredContenders.length}):</span>
              </span>
              <div className="max-h-28 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                {registeredContenders.slice(0, 5).map((c, i) => (
                  <button
                    key={c.participantId || i}
                    type="button"
                    onClick={() => handleQuickFill(c)}
                    className="w-full text-left p-1.5 rounded bg-dark-950/80 border border-white/10 hover:border-fest-cyan/40 text-[10px] flex items-center justify-between text-slate-300 hover:text-white transition-colors"
                  >
                    <span>{c.name} ({c.email || `${c.participantId}@diu.edu.bd`})</span>
                    <span className="text-fest-amber font-bold">{c.deskNumber || 'Desk 01'}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="pt-2 border-t border-white/10 text-center text-[10px] text-slate-400">
              <span>Organizers can upload the roster sheet in the Admin Portal.</span>
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
