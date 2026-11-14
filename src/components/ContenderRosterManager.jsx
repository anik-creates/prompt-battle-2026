import React, { useState } from 'react';
import { useBattle } from '../context/BattleContext';
import { parseContenderFile, downloadContenderTemplate } from '../lib/excelParser';
import { 
  Users, 
  Upload, 
  Download, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  AlertCircle, 
  Zap, 
  Check, 
  FileSpreadsheet, 
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export default function ContenderRosterManager({ onSelectForEvaluation }) {
  const { 
    registeredContenders = [], 
    tokenBudget = 2000, 
    setTokenBudget,
    addRegisteredContender, 
    bulkAddRegisteredContenders, 
    updateRegisteredContender, 
    deleteRegisteredContender,
    participants = [],
    poll,
    quiz,
    joinedParticipants = {}
  } = useBattle();

  const [searchTerm, setSearchTerm] = useState('');
  const [importStatus, setImportStatus] = useState('');
  const [importError, setImportError] = useState('');
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  // Manual Contender Add State
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');
  const [newTeam, setNewTeam] = useState('');
  const [newDesk, setNewDesk] = useState('');

  // Token budget local state
  const [budgetInput, setBudgetInput] = useState(tokenBudget);
  const [budgetSavedMsg, setBudgetSavedMsg] = useState(false);

  // Edit Contender Modal State
  const [editingContender, setEditingContender] = useState(null);

  // Handle File Upload (Excel / CSV)
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setImportStatus('');
    setImportError('');

    try {
      const parsed = await parseContenderFile(file);
      if (parsed.length === 0) {
        setImportError('No valid contender rows found. Please ensure the file contains columns for Participant ID, Name, and Team.');
      } else {
        bulkAddRegisteredContenders(parsed);
        setImportStatus(`Successfully registered ${parsed.length} contenders from ${file.name}!`);
      }
    } catch (err) {
      console.error(err);
      setImportError('Failed to parse file. Please upload a valid .xlsx, .xls, or .csv document.');
    } finally {
      setIsProcessingFile(false);
      e.target.value = '';
    }
  };

  // Handle Manual Add
  const handleManualAdd = (e) => {
    e.preventDefault();
    if (!newId.trim() || !newName.trim()) return;

    addRegisteredContender({
      participantId: newId.trim().toUpperCase(),
      name: newName.trim(),
      teamName: newTeam.trim() || 'Solo Contender',
      deskNumber: newDesk.trim() || 'Main Floor',
    });

    setNewId('');
    setNewName('');
    setNewTeam('');
    setNewDesk('');
  };

  // Handle Edit Save
  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingContender) return;

    updateRegisteredContender(editingContender.participantId, {
      name: editingContender.name.trim(),
      teamName: editingContender.teamName.trim(),
      deskNumber: editingContender.deskNumber.trim(),
    });

    setEditingContender(null);
  };

  // Handle Save Token Budget
  const handleSaveBudget = (e) => {
    e.preventDefault();
    const b = Math.max(100, Number(budgetInput) || 2000);
    setTokenBudget(b);
    setBudgetSavedMsg(true);
    setTimeout(() => setBudgetSavedMsg(false), 2500);
  };

  // Filter contenders based on search term
  const filteredContenders = (registeredContenders || []).filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      c.participantId?.toLowerCase().includes(term) ||
      c.name?.toLowerCase().includes(term) ||
      c.teamName?.toLowerCase().includes(term) ||
      c.deskNumber?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-8 font-mono text-xs">
      
      {/* TOP SECTION: EXCEL UPLOAD & TOKEN BUDGET CONFIGURATION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Card 1 & 2: Excel / CSV Importer */}
        <div className="lg:col-span-2 p-6 rounded-xl bg-dark-900 border border-white/15 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-fest-cyan" />
                <h3 className="font-sans font-bold text-base text-white uppercase tracking-tight">
                  Bulk Contender Registration (Excel / CSV)
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Upload student registration roster from organizer spreadsheet.
              </p>
            </div>

            <button
              onClick={downloadContenderTemplate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-dark-950 border border-white/10 text-slate-300 hover:text-white transition-colors text-[11px]"
              title="Download pre-formatted Excel template"
            >
              <Download className="w-3.5 h-3.5 text-fest-cyan" />
              <span>Download Excel Template</span>
            </button>
          </div>

          {/* Upload Drop Area */}
          <div className="border-2 border-dashed border-white/15 hover:border-fest-cyan/40 rounded-xl p-6 text-center transition-colors bg-dark-950/60">
            <input
              type="file"
              id="excel-contender-upload"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label
              htmlFor="excel-contender-upload"
              className="cursor-pointer flex flex-col items-center justify-center space-y-2 select-none"
            >
              <div className="w-12 h-12 rounded-full bg-fest-cyan/10 border border-fest-cyan/30 text-fest-cyan flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <span className="font-bold text-white text-sm hover:text-fest-cyan transition-colors">
                  {isProcessingFile ? 'Analyzing spreadsheet...' : 'Click to Upload Excel (.xlsx) or CSV Roster'}
                </span>
                <p className="text-[11px] text-slate-400 mt-1">
                  Supports columns: <strong>Participant ID, Name, Team Name, Desk Number</strong>
                </p>
              </div>
            </label>
          </div>

          {/* Import Status Alert */}
          {importStatus && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{importStatus}</span>
            </div>
          )}

          {importError && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{importError}</span>
            </div>
          )}
        </div>

        {/* Card 3: Benchmark Token Budget & Penalty Rule */}
        <div className="p-6 rounded-xl bg-dark-900 border border-white/15 space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-fest-pink" />
              <h3 className="font-sans font-bold text-base text-white uppercase tracking-tight">
                Token Budget & Scoring Formula
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Tokens are penalized proportionally. The more tokens used, the lower the contender's score.
            </p>
          </div>

          <form onSubmit={handleSaveBudget} className="space-y-3 pt-2">
            <div>
              <label className="block text-[11px] text-slate-300 mb-1">
                Benchmark Token Limit (Budget)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="200"
                  max="50000"
                  step="100"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  className="flex-1 px-3 py-2 rounded bg-dark-950 border border-white/15 text-white font-bold text-sm focus:border-fest-pink"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-fest-pink text-white font-bold uppercase tracking-wider hover:opacity-90"
                >
                  Save
                </button>
              </div>
              {budgetSavedMsg && (
                <span className="text-[10px] text-emerald-400 mt-1 block">
                  ✓ Token budget updated to {budgetInput} tokens.
                </span>
              )}
            </div>

            <div className="p-2.5 rounded bg-dark-950 border border-white/10 text-[10px] text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>0 Tokens Used:</span>
                <span className="text-emerald-400 font-bold">15 / 15 pts (100%)</span>
              </div>
              <div className="flex justify-between">
                <span>50% Budget Used:</span>
                <span className="text-amber-400 font-bold">8 / 15 pts (50%)</span>
              </div>
              <div className="flex justify-between">
                <span>≥ 100% Budget Used:</span>
                <span className="text-rose-400 font-bold">0 / 15 pts (0%)</span>
              </div>
            </div>
          </form>
        </div>

      </div>

      {/* QUICK INLINE ADD FORM FOR MANUAL CONTENDER */}
      <form onSubmit={handleManualAdd} className="p-4 sm:p-5 rounded-xl bg-dark-900 border border-white/15 space-y-3">
        <div className="flex items-center gap-2">
          <Plus className="w-4 h-4 text-fest-cyan" />
          <span className="font-sans font-bold text-white uppercase text-xs">
            Add Individual Contender Manually
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Participant ID *</label>
            <input
              type="text"
              required
              value={newId}
              onChange={(e) => setNewId(e.target.value)}
              placeholder="e.g. PB-106"
              className="w-full px-3 py-1.5 rounded bg-dark-950 border border-white/15 text-fest-cyan font-bold uppercase"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Shakib Ahmed"
              className="w-full px-3 py-1.5 rounded bg-dark-950 border border-white/15 text-white"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Team Name (Optional)</label>
            <input
              type="text"
              value={newTeam}
              onChange={(e) => setNewTeam(e.target.value)}
              placeholder="e.g. DIU Sparks"
              className="w-full px-3 py-1.5 rounded bg-dark-950 border border-white/15 text-white"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Desk Station (Optional)</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newDesk}
                onChange={(e) => setNewDesk(e.target.value)}
                placeholder="e.g. Desk 06"
                className="w-full px-3 py-1.5 rounded bg-dark-950 border border-white/15 text-white"
              />
              <button
                type="submit"
                className="px-4 py-1.5 rounded bg-fest-cyan text-dark-950 font-bold uppercase shrink-0 hover:opacity-90"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* REGISTERED CONTENDERS DIRECTORY */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-fest-cyan" />
              <h3 className="font-sans font-bold text-lg text-white uppercase tracking-tight">
                Official Registered Contender Directory ({registeredContenders.length})
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Judges can use this station directory to locate contenders and grade desks live.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search ID, name, or desk..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-dark-950 border border-white/15 text-white text-xs placeholder-slate-400"
            />
          </div>
        </div>

        {/* Contenders Table */}
        <div className="overflow-x-auto border border-white/10 rounded-xl">
          <table className="w-full min-w-[900px] text-left">
            <thead className="bg-dark-950 text-slate-400 text-[11px] uppercase tracking-wider border-b border-white/10">
              <tr>
                <th className="py-3 px-3">Participant ID</th>
                <th className="py-3 px-3">Contender Name</th>
                <th className="py-3 px-3">Team Name</th>
                <th className="py-3 px-3">Desk Station</th>
                <th className="py-3 px-3">Battle Submission</th>
                <th className="py-3 px-3 text-center">Kahoot Quiz</th>
                <th className="py-3 px-3 text-center">Live Poll</th>
                <th className="py-3 px-3 text-center">Tab Switches</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-dark-900/50">
              {filteredContenders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No contenders found matching your query.
                  </td>
                </tr>
              ) : (
                filteredContenders.map((c) => {
                  // Find battle submission
                  const battleSub = (participants || []).find(
                    (p) => p.participantId?.toUpperCase() === c.participantId?.toUpperCase()
                  );

                  // Find quiz submission
                  const quizSub = quiz?.submissions?.[c.participantId] || quiz?.submissions?.[c.name];

                  // Find poll vote
                  const pollVote = poll?.votes?.[c.participantId] || poll?.votes?.[c.name];

                  // Check presence
                  const isOnline = Boolean(
                    joinedParticipants[c.participantId] ||
                    joinedParticipants[c.name]
                  );

                  // Tab switches
                  const switches = battleSub?.tabSwitches || quizSub?.tabSwitches || pollVote?.tabSwitches || 0;

                  return (
                    <tr key={c.participantId} className="hover:bg-white/[0.02] transition-colors">
                      {/* Participant ID */}
                      <td className="py-3 px-3 font-bold text-fest-cyan font-mono text-sm">
                        <span className="px-2 py-0.5 rounded bg-fest-cyan/15 border border-fest-cyan/30">
                          {c.participantId}
                        </span>
                      </td>

                      {/* Name */}
                      <td className="py-3 px-3 font-sans">
                        <div className="font-bold text-white text-sm flex items-center gap-1.5">
                          <span>{c.name}</span>
                          {isOnline && (
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Online Live"></span>
                          )}
                        </div>
                      </td>

                      {/* Team */}
                      <td className="py-3 px-3 text-fest-pink">{c.teamName || 'Solo'}</td>

                      {/* Desk */}
                      <td className="py-3 px-3 text-slate-300 font-bold">{c.deskNumber || 'Main Floor'}</td>

                      {/* Battle Status */}
                      <td className="py-3 px-3">
                        {battleSub ? (
                          <div className="space-y-0.5">
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                              SUBMITTED ({battleSub.finishTimeFormatted})
                            </span>
                            <div className="text-[10px] text-slate-400">
                              Tokens: <strong className="text-fest-pink">{battleSub.tokensUsed || 0}</strong> • Total: <strong className="text-white">{battleSub.totalScore || 0}/100</strong>
                            </div>
                            {battleSub.workUrl && (
                              <a
                                href={battleSub.workUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-fest-cyan hover:underline text-[10px] flex items-center gap-1"
                              >
                                <span>View Prompt</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Waiting...</span>
                        )}
                      </td>

                      {/* Quiz */}
                      <td className="py-3 px-3 text-center">
                        {quizSub ? (
                          <span className="px-2 py-0.5 rounded bg-fest-amber/20 text-fest-amber font-bold">
                            {quizSub.score || 0} pts
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Poll */}
                      <td className="py-3 px-3 text-center">
                        {pollVote ? (
                          <span className="px-2 py-0.5 rounded bg-fest-pink/20 text-fest-pink font-bold">
                            Voted
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Tab Switches */}
                      <td className="py-3 px-3 text-center">
                        {switches > 0 ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold text-[10px]">
                            <AlertCircle className="w-3 h-3 text-rose-400" />
                            <span>{switches}</span>
                          </span>
                        ) : (
                          <span className="text-emerald-400 text-[11px]">0</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {battleSub && onSelectForEvaluation && (
                            <button
                              onClick={() => onSelectForEvaluation(battleSub)}
                              className="px-2.5 py-1 rounded bg-fest-cyan/20 border border-fest-cyan/40 text-fest-cyan hover:bg-fest-cyan hover:text-dark-950 font-bold transition-all text-[11px]"
                              title="Go to Grading for this Station"
                            >
                              Grade
                            </button>
                          )}

                          <button
                            onClick={() => setEditingContender({ ...c })}
                            className="p-1.5 rounded hover:bg-white/10 text-slate-300 hover:text-white"
                            title="Edit Contender"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              if (window.confirm(`Delete ${c.name} (${c.participantId}) from roster?`)) {
                                deleteRegisteredContender(c.participantId);
                              }
                            }}
                            className="p-1.5 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400"
                            title="Delete Contender"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT CONTENDER MODAL */}
      {editingContender && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-dark-900 border border-white/15 rounded-2xl p-6 space-y-4">
            <h3 className="font-sans font-bold text-white text-base">
              Edit Contender: {editingContender.participantId}
            </h3>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-300 mb-1">Participant ID (Fixed)</label>
                <input
                  type="text"
                  disabled
                  value={editingContender.participantId}
                  className="w-full px-3 py-2 rounded bg-dark-950 border border-white/10 text-slate-400 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editingContender.name}
                  onChange={(e) => setEditingContender({ ...editingContender, name: e.target.value })}
                  className="w-full px-3 py-2 rounded bg-dark-950 border border-white/15 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Team Name</label>
                <input
                  type="text"
                  value={editingContender.teamName}
                  onChange={(e) => setEditingContender({ ...editingContender, teamName: e.target.value })}
                  className="w-full px-3 py-2 rounded bg-dark-950 border border-white/15 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Desk Station</label>
                <input
                  type="text"
                  value={editingContender.deskNumber}
                  onChange={(e) => setEditingContender({ ...editingContender, deskNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded bg-dark-950 border border-white/15 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingContender(null)}
                  className="px-4 py-2 rounded text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-fest-cyan text-dark-950 font-bold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
