import React, { useState, useMemo } from 'react';
import { useBattle } from '../context/BattleContext';
import { parseContenderFile, downloadContenderTemplate } from '../lib/excelParser';
import { parseContenderJSON, downloadSampleContenderJSON } from '../lib/jsonParser';
import { getFinishStatusScore, evaluateTotalScore, calculateTokenScore } from '../lib/scoringCalculator';
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
  FileCode,
  ExternalLink,
  ChevronRight,
  ClipboardList,
  RotateCcw,
  MapPin,
  Save,
  X,
  Award,
  Radio
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
    joinedParticipants = {},
    clearAllPresence,
    updateParticipantMarks
  } = useBattle();

  const [importMethod, setImportMethod] = useState('json'); // 'json' | 'excel'
  const [jsonInputText, setJsonInputText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [importStatus, setImportStatus] = useState('');
  const [importError, setImportError] = useState('');
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  // Manual Contender Add State
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPasscode, setNewPasscode] = useState('');
  const [newTeam, setNewTeam] = useState('');
  const [newDesk, setNewDesk] = useState('');

  // Token budget local state
  const [budgetInput, setBudgetInput] = useState(tokenBudget);
  const [budgetSavedMsg, setBudgetSavedMsg] = useState(false);

  // Edit Contender Modal State
  const [editingContender, setEditingContender] = useState(null);

  // Handle JSON File or Excel File Upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setImportStatus('');
    setImportError('');

    try {
      let parsed = [];
      if (file.name.endsWith('.json')) {
        const text = await file.text();
        parsed = parseContenderJSON(text);
      } else {
        parsed = await parseContenderFile(file);
      }

      if (parsed.length === 0) {
        setImportError('No valid participant rows found. Ensure the file contains "participantId" (or "id") and "name".');
      } else {
        bulkAddRegisteredContenders(parsed);
        setImportStatus(`Successfully registered ${parsed.length} participants from ${file.name}!`);
      }
    } catch (err) {
      console.error(err);
      setImportError(err.message || 'Failed to parse file. Please verify syntax.');
    } finally {
      setIsProcessingFile(false);
      e.target.value = '';
    }
  };

  // Handle Direct JSON Paste
  const handlePasteJSONImport = (e) => {
    e.preventDefault();
    if (!jsonInputText.trim()) return;

    setImportStatus('');
    setImportError('');

    try {
      const parsed = parseContenderJSON(jsonInputText);
      if (parsed.length === 0) {
        setImportError('No valid participants found in the pasted JSON. Please check field names ("id" and "name").');
        return;
      }

      bulkAddRegisteredContenders(parsed);
      setImportStatus(`Successfully registered ${parsed.length} participants from pasted JSON!`);
      setJsonInputText('');
    } catch (err) {
      setImportError(err.message || 'Invalid JSON syntax. Please verify commas and braces.');
    }
  };

  // Handle Manual Add
  const handleManualAdd = (e) => {
    e.preventDefault();
    if (!newId.trim() || !newName.trim()) return;

    const cleanId = newId.trim().toUpperCase();
    addRegisteredContender({
      participantId: cleanId,
      name: newName.trim(),
      email: newEmail.trim().toLowerCase() || `${cleanId.toLowerCase()}@diu.edu.bd`,
      passcode: newPasscode.trim() || `PB${Math.floor(1000 + Math.random() * 9000)}`,
      teamName: newTeam.trim() || 'Solo Participant',
      deskNumber: newDesk.trim() || 'Desk 01',
    });

    setNewId('');
    setNewName('');
    setNewEmail('');
    setNewPasscode('');
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

  // Attendance & Evaluation State
  const [attendanceFilter, setAttendanceFilter] = useState('all'); // 'all' | 'present' | 'checked_in' | 'absent' | 'submitted'
  const [evaluatingSubmission, setEvaluatingSubmission] = useState(null);
  const [evaluatingMarks, setEvaluatingMarks] = useState({
    objectiveScore: 0,
    finishStatus: 'Partially Fulfilled',
    presentationScore: 0,
    noveltyScore: 0,
    timeScore: 15,
    tokenScore: 15,
  });

  // Calculate Attendance Stats
  const attendanceStats = useMemo(() => {
    let presentCount = 0;
    let checkedInCount = 0;
    let absentCount = 0;
    let submittedCount = 0;

    (registeredContenders || []).forEach((c) => {
      const presence = joinedParticipants[c.participantId] || joinedParticipants[c.name];
      const isOnline = Boolean(presence && presence.lastSeen && (Date.now() - presence.lastSeen < 60000));
      const isCheckedIn = Boolean(presence && presence.lastSeen);
      const isSubmitted = (participants || []).some(
        (p) => p.participantId?.toUpperCase() === c.participantId?.toUpperCase()
      );

      if (isOnline) presentCount++;
      if (isCheckedIn) checkedInCount++;
      else absentCount++;
      if (isSubmitted) submittedCount++;
    });

    return {
      total: (registeredContenders || []).length,
      present: presentCount,
      checkedIn: checkedInCount,
      absent: absentCount,
      submitted: submittedCount
    };
  }, [registeredContenders, joinedParticipants, participants]);

  // Open Evaluation Modal for a Contender
  const handleOpenEvaluation = (battleSub, contender) => {
    const rawTokens = Number(battleSub.tokensUsed) || 0;
    const computedTokenScore = calculateTokenScore(rawTokens).score;

    setEvaluatingSubmission({
      ...battleSub,
      deskNumber: battleSub.deskNumber || contender?.deskNumber || 'Desk Station'
    });
    setEvaluatingMarks({
      tokensUsed: rawTokens, // Antigravity daily limit % used
      tokenScore: battleSub.tokenScore !== undefined ? battleSub.tokenScore : computedTokenScore,
      objectiveScore: battleSub.objectiveScore || 0,
      finishStatus: battleSub.finishStatus || 'Partially Fulfilled',
      presentationScore: battleSub.presentationScore || 0,
      noveltyScore: battleSub.noveltyScore || 0,
      timeScore: battleSub.timeScore !== undefined ? battleSub.timeScore : 15,
    });
  };

  const handleTokenPercentChange = (val) => {
    const percent = Math.min(100, Math.max(0, Number(val) || 0));
    const newScore = calculateTokenScore(percent).score;
    setEvaluatingMarks((prev) => ({
      ...prev,
      tokensUsed: percent,
      tokenScore: newScore
    }));
  };

  // Live Composite Score in Evaluation Modal
  const currentCompositeTotal = useMemo(() => {
    if (!evaluatingSubmission) return 0;
    const statusScore = getFinishStatusScore(evaluatingMarks.finishStatus);
    const obj = Math.min(25, Math.max(0, Number(evaluatingMarks.objectiveScore) || 0));
    const pres = Math.min(15, Math.max(0, Number(evaluatingMarks.presentationScore) || 0));
    const nov = Math.min(15, Math.max(0, Number(evaluatingMarks.noveltyScore) || 0));
    const tScore = Number(evaluatingMarks.timeScore) || 0;
    const tokScore = Number(evaluatingMarks.tokenScore) || 0;
    return Math.min(100, Math.max(0, tScore + tokScore + obj + statusScore + pres + nov));
  }, [evaluatingSubmission, evaluatingMarks]);

  // Save Marks from Modal
  const handleSaveMarks = (e) => {
    e.preventDefault();
    if (!evaluatingSubmission) return;

    updateParticipantMarks(evaluatingSubmission.id, {
      tokensUsed: Number(evaluatingMarks.tokensUsed) || 0,
      tokenScore: Number(evaluatingMarks.tokenScore) || 0,
      objectiveScore: Number(evaluatingMarks.objectiveScore) || 0,
      finishStatus: evaluatingMarks.finishStatus,
      presentationScore: Number(evaluatingMarks.presentationScore) || 0,
      noveltyScore: Number(evaluatingMarks.noveltyScore) || 0,
      totalScore: currentCompositeTotal
    });

    setImportStatus(`Successfully saved marks for ${evaluatingSubmission.name} (${currentCompositeTotal}/100 pts)!`);
    setEvaluatingSubmission(null);
  };

  // Filter contenders based on search term & attendance filter
  const filteredContenders = (registeredContenders || []).filter((c) => {
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch = !term || (
      c.participantId?.toLowerCase().includes(term) ||
      c.studentId?.toLowerCase().includes(term) ||
      c.name?.toLowerCase().includes(term) ||
      c.couponCode?.toLowerCase().includes(term) ||
      c.studentMail?.toLowerCase().includes(term) ||
      c.personalMail?.toLowerCase().includes(term) ||
      c.email?.toLowerCase().includes(term) ||
      c.phone?.toLowerCase().includes(term) ||
      c.semester?.toLowerCase().includes(term) ||
      c.teamName?.toLowerCase().includes(term) ||
      c.deskNumber?.toLowerCase().includes(term)
    );

    if (!matchesSearch) return false;

    const presence = joinedParticipants[c.participantId] || joinedParticipants[c.name];
    const isOnline = Boolean(presence && presence.lastSeen && (Date.now() - presence.lastSeen < 60000));
    const isCheckedIn = Boolean(presence && presence.lastSeen);
    const isSubmitted = (participants || []).some(
      (p) => p.participantId?.toUpperCase() === c.participantId?.toUpperCase()
    );

    if (attendanceFilter === 'present') return isOnline;
    if (attendanceFilter === 'checked_in') return isCheckedIn;
    if (attendanceFilter === 'absent') return !isCheckedIn;
    if (attendanceFilter === 'submitted') return isSubmitted;
    return true;
  });

  return (
    <div className="space-y-8 font-mono text-xs">
      
      {/* TOP SECTION: JSON & EXCEL UPLOADER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Card 1 & 2: JSON / Excel Importer */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-dark-900 border border-white/15 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-fest-cyan" />
                <h3 className="font-sans font-bold text-base text-white uppercase tracking-tight">
                  Upload Participants via JSON / Excel
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Upload student Name & Participant ID provided by the IEEE PES DIU SBC organizers.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setImportMethod('json')}
                className={`px-3 py-1.5 rounded transition-all flex items-center gap-1.5 ${
                  importMethod === 'json'
                    ? 'bg-fest-cyan text-dark-950 font-bold shadow-[0_0_12px_rgba(0,229,255,0.4)]'
                    : 'bg-dark-950 border border-white/10 text-slate-300 hover:text-white'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>JSON Upload</span>
              </button>

              <button
                type="button"
                onClick={() => setImportMethod('excel')}
                className={`px-3 py-1.5 rounded transition-all flex items-center gap-1.5 ${
                  importMethod === 'excel'
                    ? 'bg-fest-pes text-white font-bold shadow-[0_0_12px_rgba(108,179,63,0.4)]'
                    : 'bg-dark-950 border border-white/10 text-slate-300 hover:text-white'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel (.xlsx)</span>
              </button>
            </div>
          </div>

          {/* JSON MODE */}
          {importMethod === 'json' ? (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <span className="text-slate-300 font-bold">
                  Upload .json File or Paste Array:
                </span>
                <button
                  type="button"
                  onClick={downloadSampleContenderJSON}
                  className="flex items-center gap-1.5 px-3 py-1 rounded bg-dark-950 border border-white/15 text-fest-cyan hover:text-white text-[11px]"
                  title="Download ready-to-fill JSON template"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Sample JSON Template</span>
                </button>
              </div>

              {/* JSON File Picker Dropzone */}
              <div className="border-2 border-dashed border-white/15 hover:border-fest-cyan/40 rounded-xl p-5 text-center transition-colors bg-dark-950/60">
                <input
                  type="file"
                  id="json-contender-upload"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="json-contender-upload"
                  className="cursor-pointer flex flex-col items-center justify-center space-y-2 select-none"
                >
                  <div className="w-10 h-10 rounded-full bg-fest-cyan/15 border border-fest-cyan/30 text-fest-cyan flex items-center justify-center">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-white text-xs hover:text-fest-cyan transition-colors">
                      {isProcessingFile ? 'Parsing JSON...' : 'Click to Upload .JSON Roster File'}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Accepts <code>[&#123; "id": "PB-101", "name": "..." &#125;]</code>
                    </p>
                  </div>
                </label>
              </div>

              {/* Direct Paste JSON Textarea */}
              <form onSubmit={handlePasteJSONImport} className="space-y-2 pt-1">
                <label className="block text-[11px] text-slate-400">
                  Or Paste JSON Text Directly:
                </label>
                <textarea
                  rows={4}
                  value={jsonInputText}
                  onChange={(e) => setJsonInputText(e.target.value)}
                  placeholder={`[\n  { "id": "PB-101", "name": "Shakib Ahmed", "team": "DIU Sparks" },\n  { "id": "PB-102", "name": "Tamim Iqbal", "team": "PES Titans" }\n]`}
                  className="w-full px-3 py-2 rounded-lg bg-dark-950 border border-white/15 text-white font-mono text-xs focus:border-fest-cyan resize-none"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!jsonInputText.trim()}
                    className="px-5 py-2 rounded-lg bg-fest-cyan text-dark-950 font-bold uppercase tracking-wider disabled:opacity-40 hover:opacity-90 transition-all flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Import Pasted JSON</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* EXCEL MODE */
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <span className="text-slate-300 font-bold">
                  Upload Excel (.xlsx, .xls) or CSV Spreadsheet:
                </span>
                <button
                  type="button"
                  onClick={downloadContenderTemplate}
                  className="flex items-center gap-1.5 px-3 py-1 rounded bg-dark-950 border border-white/15 text-fest-pes hover:text-white text-[11px]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Excel Template</span>
                </button>
              </div>

              <div className="border-2 border-dashed border-white/15 hover:border-fest-pes/40 rounded-xl p-6 text-center transition-colors bg-dark-950/60">
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
                  <div className="w-12 h-12 rounded-full bg-fest-pes/15 border border-fest-pes/30 text-fest-pes flex items-center justify-center">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="font-bold text-white text-xs hover:text-fest-pes transition-colors">
                      {isProcessingFile ? 'Analyzing spreadsheet...' : 'Click to Upload Excel (.xlsx) File'}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Columns: <strong>Participant ID, Name, Team Name, Desk Number</strong>
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Feedback Alerts */}
          {importStatus && (
            <div className="p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{importStatus}</span>
            </div>
          )}

          {importError && (
            <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{importError}</span>
            </div>
          )}
        </div>

        {/* Card 3: Antigravity Daily Token Limit Formula Card */}
        <div className="p-6 rounded-2xl bg-dark-900 border border-white/15 space-y-4 flex flex-col justify-between shadow-xl">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-fest-pink" />
              <h3 className="font-sans font-bold text-base text-white uppercase tracking-tight">
                Antigravity Token Scoring (15 pts)
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              The token mark is calculated solely from the percentage of daily token limit consumed in Google Antigravity.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-dark-950 border border-white/10 space-y-2 text-[11px]">
            <span className="text-[10px] text-fest-pink uppercase tracking-widest block font-bold">
              Formula: (100% - Used%) × 15 pts
            </span>
            <div className="space-y-1 font-mono text-[10px]">
              <div className="flex justify-between text-slate-300">
                <span>0% Daily Limit:</span>
                <span className="text-emerald-400 font-bold">15 / 15 pts</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>10% Daily Limit:</span>
                <span className="text-emerald-400 font-bold">14 / 15 pts</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>20% Daily Limit:</span>
                <span className="text-emerald-400 font-bold">12 / 15 pts</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>50% Daily Limit:</span>
                <span className="text-amber-400 font-bold">8 / 15 pts</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>80% Daily Limit:</span>
                <span className="text-rose-400 font-bold">3 / 15 pts</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>100% Daily Limit:</span>
                <span className="text-rose-500 font-bold">0 / 15 pts</span>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 italic">
            Judges verify the Antigravity daily limit percentage at the contender's desk station during mark entry.
          </p>
        </div>

      </div>

      {/* QUICK INLINE ADD FORM FOR MANUAL CONTENDER */}
      <form onSubmit={handleManualAdd} className="p-5 rounded-2xl bg-dark-900 border border-white/15 space-y-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-fest-cyan" />
            <span className="font-sans font-bold text-white uppercase text-xs">
              Add Individual Contender (Name & Participant ID)
            </span>
          </div>
          <span className="text-[10px] text-slate-400">
            Added immediately to official database
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Participant ID *</label>
            <input
              type="text"
              required
              value={newId}
              onChange={(e) => setNewId(e.target.value)}
              placeholder="e.g. PB-101"
              className="w-full px-3 py-2 rounded-lg bg-dark-950 border border-white/15 text-fest-cyan font-bold uppercase"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Contender Name *</label>
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Tanvir Hossain"
              className="w-full px-3 py-2 rounded-lg bg-dark-950 border border-white/15 text-white"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Email Address *</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="e.g. tanvir@diu.edu.bd"
              className="w-full px-3 py-2 rounded-lg bg-dark-950 border border-white/15 text-white font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Unique Passcode</label>
            <input
              type="text"
              value={newPasscode}
              onChange={(e) => setNewPasscode(e.target.value)}
              placeholder="e.g. PASS-9821"
              className="w-full px-3 py-2 rounded-lg bg-dark-950 border border-white/15 text-fest-pink font-bold font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Team Name</label>
            <input
              type="text"
              value={newTeam}
              onChange={(e) => setNewTeam(e.target.value)}
              placeholder="e.g. DIU Pioneers"
              className="w-full px-3 py-2 rounded-lg bg-dark-950 border border-white/15 text-white"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Desk Station</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newDesk}
                onChange={(e) => setNewDesk(e.target.value)}
                placeholder="e.g. Desk 01"
                className="w-full px-3 py-2 rounded-lg bg-dark-950 border border-white/15 text-fest-amber font-bold"
              />
              <button
                type="submit"
                className="px-3.5 py-2 rounded-lg bg-fest-cyan text-dark-950 font-bold uppercase shrink-0 hover:opacity-90 shadow-[0_0_12px_rgba(0,229,255,0.3)] text-xs"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* REGISTERED CONTENDERS DIRECTORY */}
      <div className="space-y-4">
        
        {/* Directory Header with KPI Counters */}
        <div className="p-5 rounded-2xl bg-dark-900 border border-white/15 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-fest-cyan" />
                <h3 className="font-sans font-bold text-lg text-white uppercase tracking-tight">
                  Contender Roster & Live Attendance ({registeredContenders.length} Registered)
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Uploaded via JSON / Excel. Monitors live attendance, designated desk stations, and direct judge mark entry.
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
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

              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Reset all active live connections? Any active participant phone will reconnect automatically.')) {
                    clearAllPresence();
                  }
                }}
                className="px-2.5 py-1.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-[11px] shrink-0 flex items-center gap-1.5"
                title="Purge ghost connections & refresh live active counter"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden sm:inline">Reset Presence</span>
              </button>

              {registeredContenders.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Clear all registered contenders from roster?')) {
                      bulkAddRegisteredContenders([]);
                    }
                  }}
                  className="px-2.5 py-1.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 text-[11px] shrink-0"
                  title="Clear all registered contenders"
                >
                  Clear Roster
                </button>
              )}
            </div>
          </div>

          {/* ATTENDANCE SUMMARY KPI CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3 rounded-xl bg-dark-950 border border-white/10">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Total Roster</span>
              <span className="text-2xl font-bold text-white block mt-0.5">{attendanceStats.total}</span>
              <span className="text-[10px] text-slate-400">Uploaded Contenders</span>
            </div>

            <div className="p-3 rounded-xl bg-dark-950 border border-emerald-500/30">
              <span className="text-[10px] text-emerald-400 uppercase tracking-wider block font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Present Online</span>
              </span>
              <span className="text-2xl font-bold text-emerald-400 block mt-0.5">{attendanceStats.present}</span>
              <span className="text-[10px] text-slate-400">Live Device Pings</span>
            </div>

            <div className="p-3 rounded-xl bg-dark-950 border border-fest-cyan/30">
              <span className="text-[10px] text-fest-cyan uppercase tracking-wider block font-bold">Checked In</span>
              <span className="text-2xl font-bold text-fest-cyan block mt-0.5">{attendanceStats.checkedIn}</span>
              <span className="text-[10px] text-slate-400">Authenticated Devices</span>
            </div>

            <div className="p-3 rounded-xl bg-dark-950 border border-white/10">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Absent / Waiting</span>
              <span className="text-2xl font-bold text-slate-400 block mt-0.5">{attendanceStats.absent}</span>
              <span className="text-[10px] text-slate-400">Not joined yet</span>
            </div>

            <div className="p-3 rounded-xl bg-dark-950 border border-fest-pink/30 col-span-2 sm:col-span-1">
              <span className="text-[10px] text-fest-pink uppercase tracking-wider block font-bold">Submitted</span>
              <span className="text-2xl font-bold text-fest-pink block mt-0.5">{attendanceStats.submitted}</span>
              <span className="text-[10px] text-slate-400">Ready for Mark Entry</span>
            </div>
          </div>

          {/* ATTENDANCE FILTER TABS */}
          <div className="flex items-center gap-2 overflow-x-auto pt-1 text-xs">
            <button
              type="button"
              onClick={() => setAttendanceFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                attendanceFilter === 'all'
                  ? 'bg-fest-cyan text-dark-950 font-bold shadow-[0_0_12px_rgba(0,229,255,0.4)]'
                  : 'bg-dark-950 border border-white/10 text-slate-300 hover:text-white'
              }`}
            >
              All ({attendanceStats.total})
            </button>
            <button
              type="button"
              onClick={() => setAttendanceFilter('present')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                attendanceFilter === 'present'
                  ? 'bg-emerald-400 text-dark-950 font-bold shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                  : 'bg-dark-950 border border-white/10 text-emerald-400 hover:text-white'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Present Online ({attendanceStats.present})</span>
            </button>
            <button
              type="button"
              onClick={() => setAttendanceFilter('checked_in')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                attendanceFilter === 'checked_in'
                  ? 'bg-fest-cyan text-dark-950 font-bold'
                  : 'bg-dark-950 border border-white/10 text-fest-cyan hover:text-white'
              }`}
            >
              Checked In ({attendanceStats.checkedIn})
            </button>
            <button
              type="button"
              onClick={() => setAttendanceFilter('absent')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                attendanceFilter === 'absent'
                  ? 'bg-slate-300 text-dark-950 font-bold'
                  : 'bg-dark-950 border border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              Absent ({attendanceStats.absent})
            </button>
            <button
              type="button"
              onClick={() => setAttendanceFilter('submitted')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                attendanceFilter === 'submitted'
                  ? 'bg-fest-pink text-white font-bold shadow-[0_0_12px_rgba(255,0,122,0.4)]'
                  : 'bg-dark-950 border border-white/10 text-fest-pink hover:text-white'
              }`}
            >
              <span>Submitted Work ({attendanceStats.submitted})</span>
            </button>
          </div>

        </div>

        {/* Contenders Table */}
        <div className="overflow-x-auto border border-white/10 rounded-2xl bg-dark-900/60 shadow-xl">
          <table className="w-full min-w-[980px] text-left">
            <thead className="bg-dark-950 text-slate-400 text-[11px] uppercase tracking-wider border-b border-white/10">
              <tr>
                <th className="py-3 px-3">Desk Station</th>
                <th className="py-3 px-3">Participant ID</th>
                <th className="py-3 px-3">Contender Name</th>
                <th className="py-3 px-3">Team Name</th>
                <th className="py-3 px-3">Attendance</th>
                <th className="py-3 px-3 min-w-[220px]">Battle Work & Evaluation</th>
                <th className="py-3 px-3 text-center">Kahoot Quiz</th>
                <th className="py-3 px-3 text-center">Live Poll</th>
                <th className="py-3 px-3 text-center">Tab Switches</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-dark-900/40">
              {filteredContenders.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <p className="font-bold text-white text-sm">No contenders match this filter.</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Upload JSON/Excel or change filter above.
                    </p>
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

                  // Check presence (ping in last 60s)
                  const presence = joinedParticipants[c.participantId] || joinedParticipants[c.name];
                  const isOnline = Boolean(presence && presence.lastSeen && (Date.now() - presence.lastSeen < 60000));
                  const isCheckedIn = Boolean(presence && presence.lastSeen);

                  // Tab switches
                  const switches = battleSub?.tabSwitches || quizSub?.tabSwitches || pollVote?.tabSwitches || 0;

                  return (
                    <tr key={c.participantId} className="hover:bg-white/[0.02] transition-colors">
                      {/* Desk Station */}
                      <td className="py-3 px-3">
                        <span className="px-2.5 py-1 rounded-lg bg-fest-amber/15 border border-fest-amber/40 text-fest-amber font-bold font-mono text-xs inline-flex items-center gap-1.5 shadow-[0_0_10px_rgba(255,183,0,0.15)]">
                          <MapPin className="w-3 h-3 text-fest-amber" />
                          <span>{c.deskNumber || 'Desk Station'}</span>
                        </span>
                      </td>

                      {/* Participant ID */}
                      <td className="py-3 px-3 font-bold text-fest-cyan font-mono text-sm">
                        <span className="px-2 py-0.5 rounded bg-fest-cyan/15 border border-fest-cyan/30">
                          {c.participantId}
                        </span>
                      </td>

                      {/* Name & Credentials */}
                      <td className="py-3 px-3 font-sans">
                        <div className="font-bold text-white text-sm">
                          {c.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5 space-y-0.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span>{c.studentMail || c.email}</span>
                            {(c.couponCode || c.passcode) && (
                              <span className="text-fest-pink font-bold">
                                Coupon/Pass: <code className="bg-black/50 px-1 py-0.5 rounded border border-fest-pink/30 text-fest-pink">{c.couponCode || c.passcode}</code>
                              </span>
                            )}
                          </div>
                          {(c.semester || c.phone) && (
                            <div className="text-[9px] text-slate-400 flex items-center gap-2">
                              {c.semester && <span>Sem: <strong className="text-fest-cyan">{c.semester}</strong></span>}
                              {c.phone && <span>Ph: <strong className="text-white">{c.phone}</strong></span>}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Team */}
                      <td className="py-3 px-3 text-fest-pink">{c.teamName || 'Solo Contender'}</td>

                      {/* Attendance Status */}
                      <td className="py-3 px-3">
                        {isOnline ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-[10px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span>Present (Online)</span>
                          </span>
                        ) : isCheckedIn ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-fest-cyan/15 border border-fest-cyan/30 text-fest-cyan text-[10px]">
                            <span>Checked In (Idle)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-400 text-[10px]">
                            <span>Absent</span>
                          </span>
                        )}
                      </td>

                      {/* Battle Work & Direct Mark Entry Button */}
                      <td className="py-3 px-3">
                        {battleSub ? (
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                                SUBMITTED ({battleSub.finishTimeFormatted})
                              </span>
                              <span className="px-2 py-0.5 rounded bg-dark-950 border border-white/15 text-white font-bold text-[11px]">
                                {battleSub.totalScore || 0}/100 pts
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Antigravity Limit: <strong className="text-fest-pink">{battleSub.tokensUsed || 0}%</strong> • Score: <strong className="text-emerald-400">{battleSub.tokenScore || 0}/15</strong>
                            </div>
                            {battleSub.workUrl && (
                              <a
                                href={battleSub.workUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-fest-cyan hover:underline text-[10px] flex items-center gap-1"
                              >
                                <ExternalLink className="w-2.5 h-2.5" />
                                <span className="truncate max-w-[130px]">View Prompt Link</span>
                              </a>
                            )}
                            {/* Prominent Mark Entry Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenEvaluation(battleSub, c)}
                              className="w-full mt-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-fest-cyan via-fest-pes to-fest-pink text-dark-950 font-bold uppercase tracking-wider text-[11px] shadow-[0_0_12px_rgba(0,229,255,0.3)] hover:opacity-95 transition-all flex items-center justify-center gap-1.5"
                              title="Enter or update marks for this contender"
                            >
                              <Award className="w-3.5 h-3.5 text-dark-950" />
                              <span>{battleSub.totalScore > 0 ? 'Edit Marks' : 'Enter Marks'}</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">Waiting for submission...</span>
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
                          <button
                            onClick={() => setEditingContender({ ...c })}
                            className="p-1.5 rounded hover:bg-white/10 text-slate-300 hover:text-white"
                            title="Edit Contender Details"
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

      {/* EDIT CONTENDER DETAILS MODAL */}
      {editingContender && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-dark-900 border border-white/15 rounded-2xl p-6 space-y-4 shadow-2xl">
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

      {/* DEDICATED JUDGE MARK ENTRY / EVALUATION MODAL */}
      {evaluatingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md font-mono">
          <div className="w-full max-w-xl bg-dark-900 border-2 border-fest-cyan/40 rounded-3xl p-6 sm:p-7 space-y-5 shadow-[0_0_60px_rgba(0,229,255,0.25)] max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-white/10">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded bg-fest-amber/20 border border-fest-amber/40 text-fest-amber font-bold text-xs flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-fest-amber" />
                    <span>{evaluatingSubmission.deskNumber || 'Desk Station'}</span>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-fest-cyan/15 border border-fest-cyan/30 text-fest-cyan font-bold text-xs">
                    {evaluatingSubmission.participantId}
                  </span>
                </div>
                <h3 className="font-sans font-bold text-white text-xl mt-1.5">
                  Evaluate & Enter Marks: {evaluatingSubmission.name}
                </h3>
                <p className="text-xs text-fest-pink">
                  {evaluatingSubmission.teamName || 'Solo Contender'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setEvaluatingSubmission(null)}
                className="p-1.5 rounded-lg bg-dark-950 border border-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Prompt Work Link & Submission Meta */}
            <div className="p-3.5 rounded-xl bg-dark-950 border border-white/10 space-y-2 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-slate-400">Finish Time: <strong className="text-white">{evaluatingSubmission.finishTimeFormatted}</strong></span>
                <span className="text-slate-400">Antigravity Daily Limit: <strong className="text-fest-pink">{evaluatingSubmission.tokensUsed || 0}% Used</strong></span>
              </div>
              {evaluatingSubmission.workUrl ? (
                <div className="flex items-center justify-between pt-1 border-t border-white/5">
                  <span className="text-slate-400 truncate max-w-[280px]">Link: {evaluatingSubmission.workUrl}</span>
                  <a
                    href={evaluatingSubmission.workUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 rounded bg-fest-cyan/15 border border-fest-cyan/30 text-fest-cyan hover:bg-fest-cyan hover:text-dark-950 font-bold transition-all flex items-center gap-1 text-[11px] shrink-0"
                  >
                    <span>Open Prompt Link</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ) : (
                <p className="text-slate-400 text-[11px] italic">No online prompt URL provided. Inspect prompt locally on station screen.</p>
              )}
            </div>

            {/* Rubric Inputs Form */}
            <form onSubmit={handleSaveMarks} className="space-y-4 text-xs">
              
              {/* Automated Penalties (Preview & Token Percentage Adjustment) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-dark-950 border border-white/10">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400 font-bold">Time Score</span>
                    <span className="text-emerald-400 font-bold">{evaluatingMarks.timeScore}/15 pts</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">Automated time elapsed penalty</p>
                </div>

                <div className="p-3 rounded-xl bg-dark-950 border border-fest-pink/30 space-y-1">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-300 font-bold">Antigravity Token Score</span>
                    <span className="text-fest-pink font-bold">{evaluatingMarks.tokenScore}/15 pts</span>
                  </div>
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <span className="text-[10px] text-slate-400">Daily Limit:</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={evaluatingMarks.tokensUsed}
                      onChange={(e) => handleTokenPercentChange(e.target.value)}
                      className="w-16 px-1.5 py-0.5 rounded bg-dark-900 border border-white/20 text-white font-mono text-[11px] font-bold text-center"
                    />
                    <span className="text-[10px] text-fest-pink font-bold">%</span>
                  </div>
                  <p className="text-[9px] text-slate-400">(100% - {evaluatingMarks.tokensUsed}%) × 15 = {evaluatingMarks.tokenScore} pts</p>
                </div>
              </div>

              {/* Judge Criteria 1: Objective Fulfillment */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-slate-200 font-bold">1. Objective Fulfillment (0 - 25 pts) *</label>
                  <span className="text-fest-cyan font-bold text-sm">{evaluatingMarks.objectiveScore} / 25</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="25"
                  value={evaluatingMarks.objectiveScore}
                  onChange={(e) => setEvaluatingMarks({ ...evaluatingMarks, objectiveScore: Number(e.target.value) })}
                  className="w-full accent-fest-cyan"
                />
              </div>

              {/* Judge Criteria 2: Finish Status */}
              <div>
                <label className="block text-slate-200 font-bold mb-1">2. Finish Status (0 - 15 pts) *</label>
                <select
                  value={evaluatingMarks.finishStatus}
                  onChange={(e) => setEvaluatingMarks({ ...evaluatingMarks, finishStatus: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-dark-950 border border-white/15 text-white"
                >
                  <option value="Fully Completed">Fully Completed (15 pts)</option>
                  <option value="Substantially Completed">Substantially Completed (12 pts)</option>
                  <option value="Partially Fulfilled">Partially Fulfilled (8 pts)</option>
                  <option value="Minimal Fulfillment">Minimal Fulfillment (4 pts)</option>
                </select>
              </div>

              {/* Judge Criteria 3 & 4: Presentation & Novelty */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-slate-200 font-bold">3. Presentation Skill (0 - 15) *</label>
                    <span className="text-fest-amber font-bold">{evaluatingMarks.presentationScore}/15</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="15"
                    value={evaluatingMarks.presentationScore}
                    onChange={(e) => setEvaluatingMarks({ ...evaluatingMarks, presentationScore: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-dark-950 border border-white/15 text-white"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-slate-200 font-bold">4. Novelty & Prompt Craft (0 - 15) *</label>
                    <span className="text-fest-pink font-bold">{evaluatingMarks.noveltyScore}/15</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="15"
                    value={evaluatingMarks.noveltyScore}
                    onChange={(e) => setEvaluatingMarks({ ...evaluatingMarks, noveltyScore: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-dark-950 border border-white/15 text-white"
                  />
                </div>
              </div>

              {/* Live Composite Total Score Preview */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-fest-cyan/15 via-fest-pes/15 to-fest-pink/15 border border-white/15 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">
                    Composite Battle Score
                  </span>
                  <span className="text-xs text-slate-300">
                    Automatic Penalties + Judge Rubrics
                  </span>
                </div>
                <div className="text-3xl font-extrabold text-white font-mono flex items-baseline gap-1">
                  <span>{currentCompositeTotal}</span>
                  <span className="text-sm text-slate-400 font-normal">/100</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEvaluatingSubmission(null)}
                  className="px-4 py-2.5 rounded-lg bg-dark-950 border border-white/15 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-fest-cyan to-fest-pes text-dark-950 font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(0,229,255,0.3)] hover:opacity-90 transition-all flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Marks</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
