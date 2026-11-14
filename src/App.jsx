import React, { Component } from 'react';
import { BattleProvider, useBattle } from './context/BattleContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PresentationView from './components/PresentationView';
import AdminView from './components/AdminView';
import ParticipantSubmitView from './components/ParticipantSubmitView';
import { AlertTriangle, RotateCcw } from 'lucide-react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Prompt Battle Runtime Error caught by Boundary:', error, errorInfo);
  }

  handleReset = () => {
    localStorage.removeItem('pb_local_state_v3');
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-dark-950 text-white flex items-center justify-center p-6 text-center">
          <div className="max-w-md p-8 rounded-xl bg-dark-900 border border-rose-500/40 space-y-4">
            <div className="w-14 h-14 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/40">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold font-sans">Arena Display Recovery</h2>
            <p className="text-xs font-mono text-slate-400">
              A temporary display synchronization error occurred. Click below to refresh and re-sync with the live arena database.
            </p>
            <button
              onClick={this.handleReset}
              className="px-5 py-2.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 mx-auto"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Re-sync Arena</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function MainContent() {
  const { activeView } = useBattle();

  return (
    <main className="flex-1 w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
      {activeView === 'presentation' && <PresentationView />}
      {activeView === 'submit' && <ParticipantSubmitView />}
      {activeView === 'admin' && <AdminView />}
    </main>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BattleProvider>
        <div className="min-h-screen flex flex-col bg-mesh-dark relative selection:bg-fest-pink selection:text-white">
          <div className="h-1 w-full bg-gradient-to-r from-fest-cyan via-fest-pink via-fest-amber to-fest-pes"></div>
          <Navbar />
          <MainContent />
          <Footer />
        </div>
      </BattleProvider>
    </ErrorBoundary>
  );
}
