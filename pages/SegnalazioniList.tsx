import React from 'react';
import { MaintenanceManager } from '../components/MaintenanceManager';

export const SegnalazioniList: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Segnalazioni Manutenzione</h1>
          <p className="text-sm text-gray-500 mt-1">Monitora e risolvi i problemi degli edifici</p>
      </div>
      <MaintenanceManager />
    </div>
  );
};