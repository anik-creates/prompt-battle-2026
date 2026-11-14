import React, { useState } from 'react';
import { useBattle } from '../context/BattleContext';
import { getStoredFirebaseConfig } from '../lib/firebase';
import { 
  Cloud, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  HelpCircle, 
  Key, 
  Database,
  Radio,
  ExternalLink
} from 'lucide-react';

export default function FirebaseModal({ isOpen, onClose }) {
  const { 
    firebaseStatus, 
    firebaseError, 
    configureFirebase 
  } = useBattle();

  const [jsonInput, setJsonInput] = useState(() => {
    const stored = getStoredFirebaseConfig();
    return stored ? JSON.stringify(stored, null, 2) : '';
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!jsonInput.trim()) {
      configureFirebase(null);
      setSuccessMsg('Reverted to Local Broadcast Mode.');
      return;
    }

    try {
      const parsed = JSON.parse(jsonInput.trim());
      if (!parsed.apiKey || !parsed.projectId) {
        setErrorMsg('JSON is missing required fields (apiKey, projectId).');
        return;
      }

      const res = configureFirebase(parsed);
      if (res.success) {
        setSuccessMsg('Successfully connected to Firebase Firestore!');
      } else {
        setErrorMsg(res.error || 'Failed to connect to Firebase.');
      }
    } catch (err) {
      setErrorMsg('Invalid JSON format. Please paste valid Firebase config JSON.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-xl bg-dark-900 border border-white/15 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-dark-950">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-fest-cyan" />
            <h3 className="font-sans font-bold text-white text-base">
              Cloud Realtime Sync Configuration
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          
          {/* Status Indicator */}
          <div className="flex items-center justify-between p-3 rounded bg-dark-950 border border-white/10 text-xs font-mono">
            <span className="text-slate-400">Current Status:</span>
            <span className={`inline-flex items-center gap-1.5 font-bold ${
              firebaseStatus === 'connected' 
                ? 'text-emerald-400' 
                : firebaseStatus === 'error'
                ? 'text-rose-400'
                : 'text-amber-400'
            }`}>
              <Radio className="w-3.5 h-3.5" />
              {firebaseStatus === 'connected' 
                ? 'Connected to Firebase Cloud' 
                : firebaseStatus === 'error'
                ? 'Connection Error'
                : 'Local Tab Sync Active'}
            </span>
          </div>

          <div className="text-xs text-slate-400 leading-relaxed space-y-2">
            <p>
              By default, Prompt Battle works immediately across tabs on this computer via <code className="text-fest-cyan">BroadcastChannel</code>.
            </p>
            <p>
              For <strong className="text-slate-200">multi-device synchronization</strong> during the live event (participants scanning QR on smartphones, admin on laptop, projector on auditorium screen), paste your free Firebase config below:
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded bg-rose-500/15 border border-rose-500/30 text-rose-300 font-mono text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs uppercase font-mono tracking-wider text-slate-300 mb-1.5">
                Firebase Web Config (JSON)
              </label>
              <textarea
                rows={7}
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder={`{\n  "apiKey": "AIzaSy...",\n  "authDomain": "eee-fest.firebaseapp.com",\n  "projectId": "eee-fest-prompt-battle",\n  "storageBucket": "...",\n  "messagingSenderId": "...",\n  "appId": "..."\n}`}
                className="w-full p-3 font-mono text-xs rounded bg-dark-950 border border-white/10 focus:border-fest-cyan focus:ring-1 focus:ring-fest-cyan text-slate-200 placeholder-slate-400"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <a
                href="https://console.firebase.google.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-fest-cyan hover:text-fest-pink font-mono"
              >
                <span>Firebase Console</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded text-xs font-mono text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded bg-fest-cyan text-dark-950 font-mono text-xs font-bold hover:bg-fest-cyan/90 transition-all shadow-[0_0_15px_rgba(0,229,255,0.4)]"
                >
                  Save & Connect
                </button>
              </div>
            </div>
          </form>

        </div>

      </div>
    </div>
  );
}
