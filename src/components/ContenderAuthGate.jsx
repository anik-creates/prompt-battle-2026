import React, { useState, useEffect, useMemo } from 'react';
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
  Sparkles,
  Phone,
  GraduationCap,
  Ticket,
  Search,
  X,
  Copy,
  Check
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

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [passcodeInput, setPasscodeInput] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [error, setError] = useState('');
  const [copiedField, setCopiedField] = useState(null);

  // Quick picker search modal
  const [showQuickPicker, setShowQuickPicker] = useState(false);
  const [quickSearch, setQuickSearch] = useState('');

  // Enriched session with full profile attributes from registered roster
  const activeContender = useMemo(() => {
    if (!session) return null;
    const match = (registeredContenders || []).find((c) => {
      const sId = (session.studentId || session.participantId || '').trim().toLowerCase();
      const sMail = (session.email || session.studentMail || '').trim().toLowerCase();
      const cId = (c.participantId || c.studentId || '').trim().toLowerCase();
      const cStudentMail = (c.studentMail || '').trim().toLowerCase();
      const cPersonalMail = (c.personalMail || '').trim().toLowerCase();
      const cEmail = (c.email || '').trim().toLowerCase();

      return (
        (sId && cId === sId) ||
        (sMail && (cStudentMail === sMail || cPersonalMail === sMail || cEmail === sMail))
      );
    });

    if (match) {
      return {
        ...match,
        ...session,
        participantId: session.participantId || match.participantId || match.studentId,
        studentId: session.studentId || match.studentId || match.participantId,
        name: session.name || match.name,
        studentMail: match.studentMail || session.studentMail || session.email,
        personalMail: match.personalMail || session.personalMail,
        email: session.email || match.email || match.studentMail,
        semester: match.semester || session.semester || 'N/A',
        phone: match.phone || session.phone || 'N/A',
        couponCode: match.couponCode || session.couponCode || match.passcode,
        deskNumber: session.deskNumber || match.deskNumber || 'Desk 01',
      };
    }
    return session;
  }, [session, registeredContenders]);

  // Maintain live presence heartbeat (every 20s) when session is active
  useEffect(() => {
    if (isSimulator) return; // Do not count admin simulator as a live mobile participant

    if (activeContender) {
      if (onAuthenticated) onAuthenticated(activeContender);
      const ping = () => {
        registerPresence({
          participantId: activeContender.participantId || activeContender.studentId,
          name: activeContender.name,
          email: activeContender.email,
          studentMail: activeContender.studentMail,
          personalMail: activeContender.personalMail,
          teamName: activeContender.teamName,
          deskNumber: activeContender.deskNumber,
          arena: activeArena,
        });
      };
      ping();
      const interval = setInterval(ping, 20000);
      return () => clearInterval(interval);
    }
  }, [activeContender, isSimulator, onAuthenticated, registerPresence, activeArena]);

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    const cleanEmail = emailInput.trim().toLowerCase();
    const cleanPasscode = passcodeInput.trim();

    if (!cleanEmail) {
      setError('Please provide your registered Email (Student Mail or Personal Mail) or Student ID.');
      return;
    }

    if (!cleanPasscode) {
      setError('Please provide your Coupon Code (Password) provided by IEEE PES DIU SBC.');
      return;
    }

    // Authenticate via context
    const res = authenticateContender(cleanEmail, cleanPasscode);

    if (res.success && res.contender) {
      const match = res.contender;
      const contenderData = {
        participantId: match.participantId || match.studentId || 'PB-CONTENDER',
        studentId: match.studentId || match.participantId || 'N/A',
        name: match.name || cleanEmail.split('@')[0],
        email: match.email || cleanEmail,
        studentMail: match.studentMail || cleanEmail,
        personalMail: match.personalMail || '',
        semester: match.semester || '',
        phone: match.phone || '',
        couponCode: match.couponCode || match.passcode || cleanPasscode,
        passcode: match.passcode || match.couponCode || cleanPasscode,
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
      setShowProfileModal(true); // Open designated desk & profile immediately
      setError('');
    } else {
      if (registeredContenders.length === 0) {
        setError('No contenders found on roster. Please ask organizers to verify the participants list.');
      } else {
        setError(res.error || 'Invalid Email or Coupon Code. Please check your credentials.');
      }
    }
  };

  const handleQuickFill = (c) => {
    if (!c) return;
    setEmailInput(c.studentMail || c.email || c.personalMail || c.participantId);
    setPasscodeInput(c.couponCode || c.passcode || '');
    setError('');
    setShowQuickPicker(false);
  };

  const handleLogout = () => {
    if (window.confirm('Switch Contender Account? Any in-progress answers on this device will reset.')) {
      localStorage.removeItem('pb_contender_session');
      setSession(null);
      setShowProfileModal(false);
      setEmailInput('');
      setPasscodeInput('');
    }
  };

  const copyToClipboard = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Filtered contenders for the quick-picker search
  const filteredQuickContenders = useMemo(() => {
    const term = quickSearch.trim().toLowerCase();
    if (!term) return (registeredContenders || []).slice(0, 15);
    return (registeredContenders || []).filter((c) => {
      return (
        c.name?.toLowerCase().includes(term) ||
        c.studentId?.toLowerCase().includes(term) ||
        c.participantId?.toLowerCase().includes(term) ||
        c.studentMail?.toLowerCase().includes(term) ||
        c.personalMail?.toLowerCase().includes(term) ||
        c.couponCode?.toLowerCase().includes(term) ||
        c.deskNumber?.toLowerCase().includes(term)
      );
    }).slice(0, 20);
  }, [registeredContenders, quickSearch]);

  // If user is not authenticated yet, show Login Screen
  if (!activeContender) {
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
              Enter your registered Email & unique Coupon Code (Password) provided by IEEE PES DIU SBC
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            {error && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Email / Student ID Field */}
            <div>
              <label className="block text-slate-300 font-bold mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-fest-cyan" />
                <span>Email Address / Student ID *</span>
              </label>
              <input
                type="text"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="e.g. sifat2305131213@diu.edu.bd or 232-33-213"
                className="w-full px-3 py-2.5 rounded-lg bg-dark-950 border border-white/15 text-white font-mono text-xs focus:border-fest-cyan"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Enter your Student Mail (DIU), Personal Mail, or Student ID.
              </p>
            </div>

            {/* Coupon Code / Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-slate-300 font-bold flex items-center gap-1.5">
                  <Ticket className="w-3.5 h-3.5 text-fest-pink" />
                  <span>Coupon Code (Password) *</span>
                </label>
                <span className="text-[10px] text-fest-pink font-semibold">e.g. PBC001</span>
              </div>
              <div className="relative">
                <input
                  type={showPasscode ? 'text' : 'password'}
                  required
                  value={passcodeInput}
                  onChange={(e) => setPasscodeInput(e.target.value)}
                  placeholder="Enter your Coupon Code..."
                  className="w-full px-3 py-2.5 rounded-lg bg-dark-950 border border-white/15 text-fest-pink font-bold font-mono text-sm uppercase tracking-wider focus:border-fest-pink"
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
                Your unique Coupon Code from the registration sheet is your password.
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-fest-pink to-fest-cyan text-white font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(255,0,122,0.35)] flex items-center justify-center gap-2 hover:opacity-95 text-xs"
            >
              <span>Verify & Enter Arena</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Contender Finder / Roster Helper */}
          {registeredContenders.length > 0 && (
            <div className="pt-3 border-t border-white/10 text-left space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-fest-amber" />
                  <span>Registered Contenders ({registeredContenders.length}):</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowQuickPicker(!showQuickPicker)}
                  className="text-[10px] text-fest-cyan hover:underline font-bold"
                >
                  {showQuickPicker ? 'Hide List' : 'Find My Credentials'}
                </button>
              </div>

              {showQuickPicker && (
                <div className="space-y-2 p-3 rounded-xl bg-dark-950 border border-white/10 animate-in fade-in duration-150">
                  <div className="relative">
                    <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      value={quickSearch}
                      onChange={(e) => setQuickSearch(e.target.value)}
                      placeholder="Search your name, student ID, or coupon..."
                      className="w-full pl-7 pr-3 py-1.5 rounded bg-dark-900 border border-white/10 text-[11px] text-white focus:border-fest-cyan"
                    />
                  </div>

                  <div className="max-h-40 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                    {filteredQuickContenders.map((c, i) => (
                      <button
                        key={c.participantId || i}
                        type="button"
                        onClick={() => handleQuickFill(c)}
                        className="w-full text-left p-2 rounded bg-dark-900/80 hover:bg-white/5 border border-white/5 hover:border-fest-cyan/40 text-[11px] flex items-center justify-between transition-colors"
                      >
                        <div className="truncate mr-2">
                          <span className="font-bold text-white block">{c.name}</span>
                          <span className="text-[10px] text-slate-400">{c.studentId || c.participantId} • {c.studentMail || c.email}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-fest-pink font-bold font-mono text-[10px] block">{c.couponCode || 'PBC'}</span>
                          <span className="text-fest-amber text-[10px]">{c.deskNumber || 'Desk'}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Contender is Authenticated: Render Profile Card / Modal (if showProfileModal is true) or the portal view
  return (
    <div className="w-full space-y-4">
      {/* Contender Identification Banner at the top of the Arena */}
      <div className="w-full p-2.5 sm:p-3 rounded-xl bg-dark-900 border border-white/15 flex flex-wrap items-center justify-between gap-3 text-xs font-mono shadow-sm">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="px-2 py-0.5 rounded bg-fest-cyan/20 border border-fest-cyan/40 text-fest-cyan font-bold tracking-wider shrink-0">
            {activeContender.studentId || activeContender.participantId}
          </span>
          <div className="truncate">
            <span className="font-bold text-white font-sans mr-2">{activeContender.name}</span>
            <span className="text-fest-pink text-[11px]">({activeContender.couponCode || 'Verified'})</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Designated Desk Pill (Clickable to open profile) */}
          <button
            type="button"
            onClick={() => setShowProfileModal(true)}
            className="px-2.5 py-1 rounded-lg bg-fest-amber/15 border border-fest-amber/40 text-fest-amber font-bold text-[11px] flex items-center gap-1.5 hover:bg-fest-amber/25 transition-all shadow-[0_0_10px_rgba(255,183,0,0.2)]"
            title="Click to view full contender profile & assigned desk station"
          >
            <MapPin className="w-3.5 h-3.5 text-fest-amber animate-pulse" />
            <span>{activeContender.deskNumber || 'Desk 01'}</span>
          </button>

          {/* Dedicated "My Profile" Button */}
          <button
            type="button"
            onClick={() => setShowProfileModal(true)}
            className="px-2.5 py-1 rounded-lg bg-fest-pes/15 border border-fest-pes/40 text-fest-pes font-bold text-[11px] flex items-center gap-1.5 hover:bg-fest-pes/25 transition-all shadow-[0_0_10px_rgba(0,180,216,0.2)]"
            title="Open complete participant profile"
          >
            <User className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">My Profile</span>
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
            <span className="hidden sm:inline">Switch ID</span>
          </button>
        </div>
      </div>

      {/* FULL CONTENDER PROFILE MODAL / SCREEN */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-dark-900 border-2 border-fest-amber/50 shadow-[0_0_70px_rgba(255,183,0,0.3)] p-6 sm:p-8 space-y-6 font-mono max-h-[92vh] overflow-y-auto custom-scrollbar relative">
            
            {/* Close Button */}
            <button
              onClick={() => setShowProfileModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-white/10 text-slate-400 hover:text-white hover:bg-white/20 transition-colors"
              title="Close Profile"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Profile Header */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-fest-cyan/15 border border-fest-cyan/30 text-fest-cyan text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified IEEE PES Contender</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-sans text-white">
                {activeContender.name}
              </h2>
              <p className="text-xs text-slate-400">
                IEEE PES DIU SBC • Prompt Battle 2026 Official Contender
              </p>
            </div>

            {/* Large Glowing Designated Desk Station Card */}
            <div className="p-5 sm:p-6 rounded-2xl bg-dark-950/90 border-2 border-fest-amber/40 shadow-inner text-center space-y-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2 w-20 h-20 bg-fest-amber/10 rounded-full blur-xl pointer-events-none"></div>
              <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block flex items-center justify-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-fest-amber" />
                <span>YOUR ASSIGNED DESK STATION</span>
              </span>
              <div className="text-4xl sm:text-5xl font-black font-sans text-fest-amber tracking-tight drop-shadow-[0_0_20px_rgba(255,183,0,0.6)] py-1">
                {activeContender.deskNumber || 'Desk 01'}
              </div>
              <p className="text-[11px] text-slate-300">
                Please be seated at <strong className="text-fest-amber">{activeContender.deskNumber || 'your designated desk'}</strong>. Judges will evaluate your station.
              </p>
            </div>

            {/* Complete Profile Details Grid */}
            <div className="space-y-2.5">
              <span className="text-[11px] font-bold uppercase text-slate-300 tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-fest-cyan" />
                <span>Contender Information</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                
                {/* Full Name */}
                <div className="p-3 rounded-xl bg-dark-950 border border-white/10 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Full Name</span>
                  <span className="font-bold text-white block">{activeContender.name}</span>
                </div>

                {/* Student ID */}
                <div className="p-3 rounded-xl bg-dark-950 border border-white/10 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Student ID</span>
                  <span className="font-bold text-fest-cyan font-mono block">{activeContender.studentId || activeContender.participantId}</span>
                </div>

                {/* Coupon Code (Password) */}
                <div className="p-3 rounded-xl bg-dark-950 border border-fest-pink/30 space-y-1 relative group">
                  <span className="text-[10px] text-fest-pink uppercase tracking-wider block font-bold">
                    Coupon Code (Password)
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white font-mono text-sm tracking-wider">
                      {activeContender.couponCode || activeContender.passcode}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(activeContender.couponCode || activeContender.passcode, 'coupon')}
                      className="p-1 rounded bg-white/10 text-slate-300 hover:text-white"
                      title="Copy Coupon Code"
                    >
                      {copiedField === 'coupon' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                {/* Current Semester */}
                <div className="p-3 rounded-xl bg-dark-950 border border-white/10 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                    <GraduationCap className="w-3 h-3 text-fest-cyan" />
                    <span>Current Semester</span>
                  </span>
                  <span className="font-bold text-white block">{activeContender.semester || 'N/A'}</span>
                </div>

                {/* Student Mail */}
                <div className="p-3 rounded-xl bg-dark-950 border border-white/10 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                    <Mail className="w-3 h-3 text-fest-pes" />
                    <span>Student Mail (DIU)</span>
                  </span>
                  <span className="font-mono text-slate-300 text-[11px] block truncate" title={activeContender.studentMail}>
                    {activeContender.studentMail || 'N/A'}
                  </span>
                </div>

                {/* Personal Mail */}
                <div className="p-3 rounded-xl bg-dark-950 border border-white/10 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                    <Mail className="w-3 h-3 text-fest-amber" />
                    <span>Personal Mail</span>
                  </span>
                  <span className="font-mono text-slate-300 text-[11px] block truncate" title={activeContender.personalMail}>
                    {activeContender.personalMail || 'N/A'}
                  </span>
                </div>

                {/* Contact Number */}
                <div className="p-3 rounded-xl bg-dark-950 border border-white/10 space-y-1 sm:col-span-2">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                    <Phone className="w-3 h-3 text-emerald-400" />
                    <span>Contact Number</span>
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-white font-bold block">{activeContender.phone || 'N/A'}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(activeContender.phone, 'phone')}
                      className="p-1 rounded bg-white/10 text-slate-300 hover:text-white"
                      title="Copy Phone Number"
                    >
                      {copiedField === 'phone' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* Verification Note */}
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Roster status: Verified with official IEEE PES DIU SBC registration sheet.</span>
            </div>

            {/* Action Button to Proceed to Battle Arena */}
            <button
              onClick={() => setShowProfileModal(false)}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-fest-amber via-fest-pes to-fest-cyan text-dark-950 font-bold font-sans uppercase tracking-wider shadow-[0_0_25px_rgba(255,183,0,0.4)] flex items-center justify-center gap-2 hover:opacity-95 transition-all text-xs"
            >
              <span>Proceed to Competition Arena</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Render Portal Views with activeContender passed to children */}
      {typeof children === 'function' ? children(activeContender) : children}
    </div>
  );
}
