import React from 'react';
import { useBattle } from '../context/BattleContext';
import { 
  Cpu, 
  Terminal, 
  Award, 
  ExternalLink,
  Shield,
  Layers,
  Sparkles,
  Lock,
  ShieldCheck,
  Scale
} from 'lucide-react';

export default function Footer() {
  const { switchView } = useBattle();
  return (
    <footer className="mt-auto border-t border-white/10 bg-dark-950/95 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Layout (Plain, elegant, no cards) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center pb-10 border-b border-white/10">
          
          {/* Prominent Footer Logo Showcase */}
          <div className="md:col-span-5 flex flex-col items-start space-y-4">
            <div className="text-xs uppercase font-mono tracking-widest text-slate-400 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-fest-pink" />
              Official Event Partner & Patron
            </div>
            
            {/* Prominent Footer Logo Container */}
            <div className="p-3 bg-dark-900/80 rounded-xl border border-white/10 hover:border-fest-cyan/40 transition-all duration-300 shadow-[0_0_25px_rgba(0,0,0,0.6)]">
              <img 
                src="./assets/Footer Logo.png" 
                alt="EEE Fest 2026 Supporting Authority" 
                className="h-16 sm:h-20 w-auto object-contain filter drop-shadow-[0_0_15px_rgba(255,255,255,0.15)]"
              />
            </div>

            <p className="text-xs text-slate-400 font-sans max-w-sm leading-relaxed">
              Organized with precision and pride by <strong className="text-fest-pes font-semibold">IEEE Power & Energy Society DIU Student Branch Chapter</strong> for <span className="text-fest-cyan font-semibold">EEE FEST 2026</span>.
            </p>
          </div>

          {/* Quick Pillars Info */}
          <div className="md:col-span-4 grid grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <div className="text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-fest-cyan" />
                Track Focus
              </div>
              <ul className="space-y-1.5 text-slate-300">
                <li>• Prompt Engineering</li>
                <li>• Model Alignment</li>
                <li>• Token Optimization</li>
                <li>• Output Accuracy</li>
              </ul>
            </div>
            <div>
              <div className="text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-fest-amber" />
                Evaluation
              </div>
              <ul className="space-y-1.5 text-slate-300">
                <li>• Objective Score</li>
                <li>• Finish Velocity</li>
                <li>• Idea Novelty</li>
                <li>• Presentation Skill</li>
              </ul>
            </div>
          </div>

          {/* Right: Chapter Attribution */}
          <div className="md:col-span-3 flex flex-col items-start md:items-end space-y-2 text-xs font-mono">
            <span className="text-fest-gradient font-bold text-sm tracking-wide">
              PROMPT BATTLE 2026
            </span>
            <span className="text-slate-400 text-left md:text-right">
              IEEE PES DIU SBC
            </span>
            <span className="text-slate-400 text-left md:text-right">
              Daffodil International University
            </span>
            <div className="pt-2 flex items-center gap-2 text-[11px] text-slate-400">
              <Terminal className="w-3 h-3 text-fest-cyan" />
              <span>Prompt Battle Arena v1.0</span>
            </div>
          </div>

        </div>

        {/* Bottom copyright line */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 font-mono">
          <p>© 2026 IEEE PES DIU SBC • EEE FEST 2026. All rights reserved.</p>
          <p className="mt-2 sm:mt-0 flex items-center gap-2 text-slate-400">
            <span>Powered by</span>
            <span className="text-fest-pink font-semibold">PES Web Development team</span>
            <span>•</span>
            <button 
              onClick={() => switchView('judge')}
              className="text-slate-400 hover:text-fest-amber transition-colors inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-dark-900 border border-white/10 hover:border-fest-amber/40 text-[11px] font-mono"
              title="Judge Adjudication Portal"
            >
              <Scale className="w-3.5 h-3.5 text-fest-amber" />
              <span>Judge Portal</span>
            </button>
            <span>•</span>
            <button 
              onClick={() => switchView('admin')}
              className="text-slate-400 hover:text-fest-pes transition-colors inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-dark-900 border border-white/10 hover:border-fest-pes/40 text-[11px] font-mono"
              title="Admin Command Portal (pes.ieee@diu.edu.bd)"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-fest-pes" />
              <span>Admin Portal</span>
            </button>
          </p>
        </div>

      </div>
    </footer>
  );
}
