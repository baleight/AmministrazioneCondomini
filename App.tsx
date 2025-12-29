import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { CondominiList } from './pages/CondominiList';
import { ImmobiliList } from './pages/ImmobiliList';
import { AnagraficheList } from './pages/AnagraficheList';
import { SegnalazioniList } from './pages/SegnalazioniList';
import { ComunicazioniList } from './pages/ComunicazioniList';
import { Login } from './pages/Login';
import { ViewState } from './types';

// Internal component that accesses auth context
const AppContent = () => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  // Router logic
  const renderView = () => {
    // Basic protection for admin-only routes if a user manually tries to access them via state
    // (In a real URL-router app, this would be a Guard component)
    const isAdmin = user?.role === 'admin';
    
    if (!isAdmin && (currentView === 'condomini' || currentView === 'immobili' || currentView === 'anagrafiche')) {
      // Redirect user to dashboard if they try to access restricted views
      setCurrentView('dashboard');
      return <Dashboard onViewChange={setCurrentView} />;
    }

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
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}