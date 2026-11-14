import React from 'react';
import { BattleProvider, useBattle } from './context/BattleContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PresentationView from './components/PresentationView';
import AdminView from './components/AdminView';
import ParticipantSubmitView from './components/ParticipantSubmitView';

function MainContent() {
  const { activeView } = useBattle();

  return (
    <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6">
      {activeView === 'presentation' && <PresentationView />}
      {activeView === 'submit' && <ParticipantSubmitView />}
      {activeView === 'admin' && <AdminView />}
    </main>
  );
}

export default function App() {
  return (
    <BattleProvider>
      <div className="min-h-screen flex flex-col bg-mesh-dark relative selection:bg-fest-pink selection:text-white">
        
        {/* Subtle top accent beam */}
        <div className="h-1 w-full bg-gradient-to-r from-fest-cyan via-fest-pink via-fest-amber to-fest-pes"></div>
        
        <Navbar />
        <MainContent />
        <Footer />

      </div>
    </BattleProvider>
  );
}
