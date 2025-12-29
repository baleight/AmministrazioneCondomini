import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { db } from '../services/storage';
import { useAuth } from './AuthContext';
import { Condominio, Anagrafica, Immobile, Segnalazione } from '../types';

interface DataContextType {
  condomini: Condominio[];
  anagrafiche: Anagrafica[];
  immobili: Immobile[];
  segnalazioni: Segnalazione[];
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  const [condomini, setCondomini] = useState<Condominio[]>([]);
  const [anagrafiche, setAnagrafiche] = useState<Anagrafica[]>([]);
  const [immobili, setImmobili] = useState<Immobile[]>([]);
  const [segnalazioni, setSegnalazioni] = useState<Segnalazione[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  const refreshData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("🔄 Avvio sincronizzazione completa dati...");
      
      // Eseguiamo le richieste in parallelo per velocità
      const [resCondomini, resAnagrafiche, resImmobili, resSegnalazioni] = await Promise.all([
        db.select<Condominio>('condomini'),
        db.select<Anagrafica>('anagrafiche'),
        db.select<Immobile>('immobili'),
        db.select<Segnalazione>('segnalazioni')
      ]);

      setCondomini(resCondomini);
      setAnagrafiche(resAnagrafiche);
      setImmobili(resImmobili);
      setSegnalazioni(resSegnalazioni);
      
      setDataLoaded(true);
    } catch (err: any) {
      console.error("Errore caricamento dati:", err);
      setError(err.message || "Impossibile sincronizzare i dati con il server.");
    } finally {
      setLoading(false);
    }
  };

  // Trigger fetch on authentication
  useEffect(() => {
    if (isAuthenticated && !dataLoaded) {
      refreshData();
    }
  }, [isAuthenticated, dataLoaded]);

  return (
    <DataContext.Provider value={{ 
      condomini, 
      anagrafiche, 
      immobili, 
      segnalazioni, 
      loading, 
      error, 
      refreshData 
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};