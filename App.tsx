import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { CondominiList } from './pages/CondominiList';
import { ImmobiliList } from './pages/ImmobiliList';
import { AnagraficheList } from './pages/AnagraficheList';
import { SegnalazioniList } from './pages/SegnalazioniList';
import { ComunicazioniList } from './pages/ComunicazioniList';
import { ViewState } from './types';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');

  // Simple router based on state
  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onViewChange={setCurrentView} />;
      case 'condomini':
        return <CondominiList />;
      case 'immobili':
        return <ImmobiliList />;
      case 'anagrafiche':
        return <AnagraficheList />;
      case 'segnalazioni':
        return <SegnalazioniList />;
      case 'comunicazioni':
        return <ComunicazioniList />;
      default:
        return <Dashboard onViewChange={setCurrentView} />;
    }
  };

  return (
    <Layout currentView={currentView} onViewChange={setCurrentView}>
      {renderView()}
    </Layout>
  );
}