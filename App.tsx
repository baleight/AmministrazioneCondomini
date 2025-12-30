import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
import { NotificationProvider } from './context/NotificationContext';
import { usePermissions } from './hooks/usePermissions';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { CondominiList } from './pages/CondominiList';
import { ImmobiliList } from './pages/ImmobiliList';
import { AnagraficheList } from './pages/AnagraficheList';
import { SegnalazioniList } from './pages/SegnalazioniList';
import { ComunicazioniList } from './pages/ComunicazioniList';
import { DocumentiList } from './pages/DocumentiList';
import { AgendaList } from './pages/AgendaList';
import { Profile } from './pages/Profile';
import { Login } from './pages/Login';
import { ViewState } from './types';
import { CloudArrowDownIcon } from '@heroicons/react/24/outline';

const AppContent = () => {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { loading: dataLoading, error: dataError, refreshData } = useData();
  const { canAccessView } = usePermissions();
  
  // Imposta la vista iniziale in base al ruolo
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');

  // Gestione Redirect se l'utente si trova su una vista non permessa (es. Dashboard per User)
  useEffect(() => {
    if (isAuthenticated && user && !canAccessView(currentView)) {
      if (user.role === 'user') {
        setCurrentView('segnalazioni');
      } else {
        setCurrentView('dashboard');
      }
    }
  }, [isAuthenticated, user, currentView, canAccessView]);

  // 1. Auth Loading State
  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // 2. Login Screen
  if (!isAuthenticated) {
    return <Login />;
  }

  // 3. Data Loading Screen (Global Progress Bar)
  if (dataLoading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-50 z-50">
        <div className="w-full max-w-md p-6 text-center">
          <div className="mb-6 flex justify-center">
             <div className="bg-indigo-100 p-4 rounded-full animate-bounce">
                <CloudArrowDownIcon className="h-10 w-10 text-indigo-600" />
             </div>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Sincronizzazione in corso...</h2>
          <p className="text-sm text-gray-500 mb-6">Stiamo recuperando i dati dal cloud sicuro.</p>
          
          <div className="relative pt-1">
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-indigo-200">
              <div className="animate-progress-indeterminate shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-600"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 4. Global Error State
  if (dataError) {
    return (
       <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg border border-red-100 max-w-md">
           <h3 className="text-lg font-bold text-red-600 mb-2">Errore di Connessione</h3>
           <p className="text-gray-600 mb-6">{dataError}</p>
           <button 
             onClick={() => refreshData()}
             className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
           >
             Riprova Sincronizzazione
           </button>
        </div>
      </div>
    );
  }

  // 5. Main Application Routing
  const renderView = () => {
    // Se l'utente non ha i permessi per la vista corrente, mostriamo un fallback sicuro
    // L'useEffect sopra si occuperà di aggiornare lo stato 'currentView' correttamente
    if (!canAccessView(currentView)) {
      return user?.role === 'user' ? <SegnalazioniList /> : <Dashboard onViewChange={setCurrentView} />;
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
      case 'documenti':
        return <DocumentiList />;
      case 'agenda':
        return <AgendaList />;
      case 'profile':
        return <Profile />;
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
    <NotificationProvider>
      <AuthProvider>
        <DataProvider>
          <AppContent />
        </DataProvider>
      </AuthProvider>
    </NotificationProvider>
  );
}