import React, { useState } from 'react';
import { useBattle } from '../context/BattleContext';
import TimerDisplay from './TimerDisplay';
import FirebaseModal from './FirebaseModal';
import { 
  ShieldCheck, 
  Lock, 
  Key, 
  Clock, 
  Play, 
  Pause, 
  RotateCcw, 
  Trophy, 
  Eye, 
  EyeOff, 
  Cloud, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Plus, 
  Download, 
  Upload, 
  LogOut, 
  Save, 
  Edit3, 
  Sparkles,
  Users,
  Cpu,
  Layers,
  ChevronDown
} from 'lucide-react';

export default function AdminView() {
  const { 
    timer, 
    participants, 
    published, 
    isAdminAuthenticated, 
    authenticateAdmin, 
    logoutAdmin,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    updateParticipantMarks,
    addManualParticipant,
    removeParticipant,
    togglePublishLeaderboard,
    loadDemo,
    resetAllData,
    firebaseStatus
  } = useBattle();

  // Login form state
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');

  // Timer custom duration state
  const [customMinutes, setCustomMinutes] = useState(20);

  // Manual participant add state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newManualName, setNewManualName] = useState('');
  const [newManualTeam, setNewManualTeam] = useState('');
  const [newManualTime, setNewManualTime] = useState('10m 00s');

  // Firebase modal state
  const [isFirebaseOpen, setIsFirebaseOpen] = useState(false);

  // Active edit states for participant marks
  const [editingId, setEditingId] = useState(null);

  // Handle Login
  const handleLogin = (e) => {
    e.preventDefault();
    const res = authenticateAdmin(passwordInput);
    if (!res.success) {
      setAuthError(res.error);
    } else {
      setAuthError('');
      setPasswordInput('');
    }
  };

  // Preset timer selection
  const handleSetPreset = (minutes) => {
    setCustomMinutes(minutes);
    resetTimer(minutes * 60);
  };

  const handleApplyCustomMinutes = () => {
    const mins = Math.max(1, parseInt(customMinutes) || 1);
    resetTimer(mins * 60);
  };

  // Add Manual Participant
  const handleAddManual = (e) => {
    e.preventDefault();
    if (!newManualName.trim()) return;

    addManualParticipant({
      name: newManualName.trim(),
      teamName: newManualTeam.trim() || 'Solo Contender',
      finishTimeFormatted: newManualTime.trim() || '12m 00s',
      finishSeconds: 720,
      tokensUsed: 500,
      objectiveScore: 25,
      finishStatus: 'Fully Completed',
      finishStatusNotes: 'Manual entry',
      presentationScore: 20,
      noveltyScore: 20,
      totalScore: 85,
    });

    setNewManualName('');
    setNewManualTeam('');
    setShowAddModal(false);
  };

  // Export CSV for Event Judges
  const exportToCSV = () => {
    if (participants.length === 0) {
      alert('No participant records to export.');
      return;
    }

    const headers = [
      'Rank',
      'Name',
      'Team',
      'Finish Time',
      'Tokens Used',
      'Objective Score (30)',
      'Finish Status',
      'Status Notes',
      'Presentation Score (25)',
      'Novelty Score (25)',
      'Total Score (100)'
    ];

    const sorted = [...participants].sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));

    const rows = sorted.map((p, idx) => [
      idx + 1,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.teamName.replace(/"/g, '""')}"`,
      `"${p.finishTimeFormatted || ''}"`,
      p.tokensUsed || 0,
      p.objectiveScore || 0,
      `"${p.finishStatus || ''}"`,
      `"${(p.finishStatusNotes || '').replace(/"/g, '""')}"`,
      p.presentationScore || 0,
      p.noveltyScore || 0,
      p.totalScore || 0
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `prompt_battle_results_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // IF NOT AUTHENTICATED: Display Login Screen
  if (!isAdminAuthenticated) {
    return (
      <div className="w-full max-w-md mx-auto py-16 px-4">
        <div className="border border-white/10 p-8 rounded-lg bg-dark-900/90 shadow-[0_0_35px_rgba(0,0,0,0.8)] text-center">
          
          <div className="w-14 h-14 rounded-full bg-fest-pes/20 border border-fest-pes/40 text-fest-pes flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6" />
          </div>

          <h2 className="text-2xl font-bold font-sans text-white">
            Admin Portal Access
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1 mb-6">
            IEEE PES DIU SBC • EEE FEST 2026 Prompt Battle
          </p>

          {authError && (
            <div className="p-3 mb-4 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 font-mono text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label className="block text-xs uppercase font-mono tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-fest-pes" />
                Admin Secret Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter administrator password..."
                  className="w-full px-4 py-3 rounded bg-dark-950 border border-white/15 focus:border-fest-pes focus:ring-1 focus:ring-fest-pes text-white text-sm font-mono placeholder-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] font-mono text-slate-400 mt-1">
                Authorized adjudicators only. Password: <code className="text-fest-pes">eeefestadmin</code>
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded bg-gradient-to-r from-fest-pes to-emerald-600 hover:from-fest-pes/90 hover:to-emerald-500 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(108,179,63,0.3)] flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Unlock Admin Panel</span>
            </button>
          </form>

        </div>
      </div>
    );
  }

  // --- AUTHENTICATED ADMIN PANEL ---
  return (
    <div className="w-full max-w-7xl mx-auto py-6 sm:py-8 space-y-10">
      
      {/* Top Admin Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-fest-pes" />
            <h1 className="text-2xl sm:text-3xl font-extrabold font-sans text-white tracking-tight">
              ADMIN CONTROL ARENA
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Judge & Moderator Station • EEE FEST 2026
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-mono">
          {/* Cloud Sync Settings */}
          <button
            onClick={() => setIsFirebaseOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded border transition-all ${
              firebaseStatus === 'connected'
                ? 'bg-fest-cyan/10 border-fest-cyan/40 text-fest-cyan'
                : 'bg-dark-900 border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>{firebaseStatus === 'connected' ? 'Cloud Connected' : 'Cloud Setup'}</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={exportToCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded bg-dark-900 border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 transition-all"
            title="Download CSV spreadsheet of current marks"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          {/* Load Demo Data */}
          <button
            onClick={loadDemo}
            className="flex items-center gap-1.5 px-3 py-2 rounded bg-dark-900 border border-white/10 text-slate-400 hover:text-fest-cyan transition-all"
            title="Populate mock contestants for testing"
          >
            <Sparkles className="w-3.5 h-3.5 text-fest-cyan" />
            <span>Load Demo</span>
          </button>

          {/* Reset All */}
          <button
            onClick={() => {
              if (window.confirm('Reset all battle timers and participants? This cannot be undone.')) {
                resetAllData();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Arena</span>
          </button>

          {/* Logout */}
          <button
            onClick={logoutAdmin}
            className="flex items-center gap-1.5 px-3 py-2 rounded bg-dark-900 border border-white/10 text-slate-400 hover:text-white"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: MASTER LEADERBOARD PUBLISHING SWITCH */}
      <div className={`p-6 rounded-lg border transition-all ${
        published 
          ? 'bg-gradient-to-r from-emerald-950/40 via-dark-900 to-dark-950 border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.2)]'
          : 'bg-dark-900/60 border-white/15'
      }`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Trophy className={`w-5 h-5 ${published ? 'text-emerald-400' : 'text-fest-amber'}`} />
              <h2 className="text-xl font-bold font-sans text-white uppercase tracking-tight">
                Leaderboard Presentation State
              </h2>
            </div>
            <p className="text-xs font-mono text-slate-400">
              Auditorium Projector Display is currently showing:{' '}
              <strong className={published ? 'text-emerald-400' : 'text-fest-cyan'}>
                {published ? 'OFFICIAL LEADERBOARD (LIVE PUBLISHED)' : 'LIVE BATTLE ARENA & SUBMISSION FEED'}
              </strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => togglePublishLeaderboard(!published)}
              className={`px-6 py-3.5 rounded-lg font-mono text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center gap-2 ${
                published
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-[0_0_20px_rgba(217,119,6,0.3)]'
                  : 'bg-gradient-to-r from-fest-pink to-fest-cyan hover:opacity-95 text-white shadow-[0_0_25px_rgba(255,0,122,0.4)]'
              }`}
            >
              <Trophy className="w-4 h-4 fill-current" />
              <span>{published ? 'Unpublish • Show Battle Clock' : 'Publish Leaderboard to Arena'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 2: BATTLE TIMER CONFIGURATION & DISPATCH */}
      <div className="border border-white/10 rounded-lg p-6 bg-dark-900/50 space-y-6">
        
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-fest-cyan" />
            <h3 className="font-sans font-bold text-white uppercase text-base">
              Battle Timer Control Center
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Current Duration: {Math.floor(timer.duration / 60)} Minutes
          </span>
        </div>

        {/* Live Timer Preview & Controls */}
        <TimerDisplay size="medium" showControls={true} />

        {/* Preset Setup Buttons */}
        <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Presets:</span>
            {[10, 15, 20, 30, 45, 60].map((mins) => (
              <button
                key={mins}
                onClick={() => handleSetPreset(mins)}
                className={`px-3 py-1.5 rounded border transition-all ${
                  timer.duration === mins * 60
                    ? 'bg-fest-cyan/20 border-fest-cyan text-fest-cyan font-bold'
                    : 'bg-dark-950 border-white/10 text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Custom (mins):</span>
            <input
              type="number"
              min="1"
              max="180"
              value={customMinutes}
              onChange={(e) => setCustomMinutes(e.target.value)}
              className="w-16 px-2 py-1 rounded bg-dark-950 border border-white/10 text-white text-center"
            />
            <button
              onClick={handleApplyCustomMinutes}
              className="px-3 py-1 rounded bg-dark-850 hover:bg-dark-800 border border-white/10 text-slate-200"
            >
              Apply
            </button>
          </div>
        </div>

      </div>

      {/* SECTION 3: PARTICIPANT EVALUATION & SCORING MATRIX */}
      <div className="space-y-4">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-fest-cyan" />
              <h2 className="text-xl font-bold font-sans text-white uppercase tracking-tight">
                Contender Evaluation & Scoring Rubric
              </h2>
            </div>
            <p className="text-xs font-mono text-slate-400 mt-0.5">
              Input marks for Token Usage, Objective Fulfillment, Finish Status, Presentation Skill, and Novelty
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded bg-fest-cyan/15 hover:bg-fest-cyan/25 border border-fest-cyan/40 text-fest-cyan font-mono text-xs font-bold transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Contender Manually</span>
          </button>
        </div>

        {/* Contender Table (Plain, non-card, dark) */}
        {participants.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-white/10 rounded-lg font-mono text-slate-400">
            <p className="text-sm">No contenders submitted yet.</p>
            <p className="text-xs text-slate-400 mt-1">
              Participants scanning the QR code will appear here automatically with their exact finish times, or you can add them manually above.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-white/10 rounded-lg">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-dark-950 text-slate-400 uppercase tracking-wider text-[11px] border-b border-white/10">
                <tr>
                  <th className="py-3 px-3">Contender</th>
                  <th className="py-3 px-3">Finish Time</th>
                  <th className="py-3 px-3">Tokens Used</th>
                  <th className="py-3 px-3">Objective (0-30)</th>
                  <th className="py-3 px-3">Finish Status</th>
                  <th className="py-3 px-3">Presentation (0-25)</th>
                  <th className="py-3 px-3">Novelty (0-25)</th>
                  <th className="py-3 px-3 text-right">Total Score</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-dark-900/40">
                {participants.map((p) => {
                  return (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                      {/* Name & Team */}
                      <td className="py-3 px-3 font-sans">
                        <div className="font-bold text-white text-sm">{p.name}</div>
                        <div className="text-xs text-fest-pink font-mono">{p.teamName}</div>
                        {p.notes && (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5 max-w-xs truncate" title={p.notes}>
                            Note: {p.notes}
                          </div>
                        )}
                      </td>

                      {/* Recorded Finish Time */}
                      <td className="py-3 px-3">
                        <input
                          type="text"
                          value={p.finishTimeFormatted || ''}
                          onChange={(e) => updateParticipantMarks(p.id, { finishTimeFormatted: e.target.value })}
                          className="w-24 px-2 py-1 rounded bg-dark-950 border border-white/10 text-white font-mono text-xs focus:border-fest-cyan"
                          title="Finish time recorded from participant submission"
                        />
                      </td>

                      {/* Tokens Used */}
                      <td className="py-3 px-3">
                        <input
                          type="number"
                          min="0"
                          value={p.tokensUsed || 0}
                          onChange={(e) => updateParticipantMarks(p.id, { tokensUsed: Number(e.target.value) })}
                          className="w-20 px-2 py-1 rounded bg-dark-950 border border-white/10 text-white font-mono text-xs focus:border-fest-cyan"
                        />
                      </td>

                      {/* Objective Score (0-30) */}
                      <td className="py-3 px-3">
                        <input
                          type="number"
                          min="0"
                          max="30"
                          value={p.objectiveScore || 0}
                          onChange={(e) => updateParticipantMarks(p.id, { objectiveScore: Number(e.target.value) })}
                          className="w-16 px-2 py-1 rounded bg-dark-950 border border-fest-cyan/40 text-fest-cyan font-mono text-xs font-bold text-center"
                        />
                      </td>

                      {/* Finish Status */}
                      <td className="py-3 px-3">
                        <select
                          value={p.finishStatus || 'Partially Fulfilled'}
                          onChange={(e) => updateParticipantMarks(p.id, { finishStatus: e.target.value })}
                          className="px-2 py-1 rounded bg-dark-950 border border-white/15 text-slate-200 font-mono text-xs focus:border-fest-pink"
                        >
                          <option value="Fully Completed">Fully Completed (20 pts)</option>
                          <option value="Substantially Completed">Substantially Completed (16 pts)</option>
                          <option value="Partially Fulfilled">Partially Fulfilled (12 pts)</option>
                          <option value="Minimal Fulfillment">Minimal Fulfillment (6 pts)</option>
                        </select>
                      </td>

                      {/* Presentation Skill (0-25) */}
                      <td className="py-3 px-3">
                        <input
                          type="number"
                          min="0"
                          max="25"
                          value={p.presentationScore || 0}
                          onChange={(e) => updateParticipantMarks(p.id, { presentationScore: Number(e.target.value) })}
                          className="w-16 px-2 py-1 rounded bg-dark-950 border border-white/10 text-white font-mono text-xs text-center"
                        />
                      </td>

                      {/* Idea Novelty (0-25) */}
                      <td className="py-3 px-3">
                        <input
                          type="number"
                          min="0"
                          max="25"
                          value={p.noveltyScore || 0}
                          onChange={(e) => updateParticipantMarks(p.id, { noveltyScore: Number(e.target.value) })}
                          className="w-16 px-2 py-1 rounded bg-dark-950 border border-fest-pink/40 text-fest-pink font-mono text-xs font-bold text-center"
                        />
                      </td>

                      {/* Total Score */}
                      <td className="py-3 px-3 text-right">
                        <div className="text-base font-extrabold text-white font-mono">
                          {p.totalScore || 0}
                          <span className="text-[10px] text-slate-400 font-normal ml-1">/100</span>
                        </div>
                      </td>

                      {/* Delete */}
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete ${p.name}?`)) {
                              removeParticipant(p.id);
                            }
                          }}
                          className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Delete contender"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Manual Contender Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-dark-900 border border-white/15 rounded-xl p-6 space-y-4">
            <h3 className="font-sans font-bold text-white text-base">
              Add Contender Manually
            </h3>
            
            <form onSubmit={handleAddManual} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Participant Name *</label>
                <input
                  type="text"
                  required
                  value={newManualName}
                  onChange={(e) => setNewManualName(e.target.value)}
                  placeholder="e.g. Shakib Ahmed"
                  className="w-full px-3 py-2 rounded bg-dark-950 border border-white/10 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Team Name (Optional)</label>
                <input
                  type="text"
                  value={newManualTeam}
                  onChange={(e) => setNewManualTeam(e.target.value)}
                  placeholder="e.g. DIU Sparks"
                  className="w-full px-3 py-2 rounded bg-dark-950 border border-white/10 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Finish Time Recorded</label>
                <input
                  type="text"
                  value={newManualTime}
                  onChange={(e) => setNewManualTime(e.target.value)}
                  placeholder="e.g. 11m 45s"
                  className="w-full px-3 py-2 rounded bg-dark-950 border border-white/10 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-fest-cyan text-dark-950 font-bold"
                >
                  Add Contender
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Firebase Sync Settings Modal */}
      <FirebaseModal 
        isOpen={isFirebaseOpen} 
        onClose={() => setIsFirebaseOpen(false)} 
      />

    </div>
  );
}
