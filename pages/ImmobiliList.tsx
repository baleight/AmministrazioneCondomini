import React, { useState } from 'react';
import { db } from '../services/storage';
import { useData } from '../context/DataContext';
import { usePermissions } from '../hooks/usePermissions';
import { Immobile } from '../types';
import { UnitForm } from '../components/UnitForm';
import { PlusIcon, HomeIcon, UserIcon, KeyIcon, PencilSquareIcon } from '@heroicons/react/24/outline';

export const ImmobiliList: React.FC = () => {
  const { immobili, condomini, anagrafiche, refreshData } = useData();
  const { canCreateImmobile, canEditImmobile } = usePermissions();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Immobile | null>(null);

  const handleOpenModal = (unit?: Immobile) => {
    setEditingUnit(unit || null);
    setIsModalOpen(true);
  };

  const handleSave = async (data: Omit<Immobile, 'id'>) => {
    if (editingUnit) {
      await db.update<Immobile>('immobili', editingUnit.id, data);
    } else {
      await db.insert<Immobile>('immobili', data);
    }
    setIsModalOpen(false);
    setEditingUnit(null);
    await refreshData();
  };

  const getCondoName = (id: number) => condomini.find(c => c.id === id)?.nome || 'Edificio Sconosciuto';
  const getPersonName = (id?: number) => anagrafiche.find(p => p.id === id)?.nome || 'Libero';

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Unità Immobiliari</h1>
          <p className="text-sm text-gray-500 mt-1">Gestisci appartamenti, uffici e box</p>
        </div>
        {canCreateImmobile && (
          <button 
            onClick={() => handleOpenModal()}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <PlusIcon className="h-5 w-5" />
            Aggiungi Unità
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {immobili.map(unit => (
          <div key={unit.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow relative group">
            
            {canEditImmobile && (
              <div className="absolute top-4 right-4 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleOpenModal(unit)}
                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                  >
                    <PencilSquareIcon className="h-5 w-5" />
                  </button>
              </div>
            )}

            <div className="flex items-center gap-3 mb-4 pr-10">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg flex-shrink-0">
                <HomeIcon className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-gray-900 truncate">{unit.nome}</h3>
                <p className="text-xs text-gray-500 truncate">{getCondoName(unit.condominio_id)}</p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-gray-50 pb-2">
                <span className="text-gray-500">Piano</span>
                <span className="font-medium">{unit.piano}</span>
              </div>
              <div className="flex justify-between border-b border-gray-50 pb-2">
                <span className="text-gray-500">Superficie</span>
                <span className="font-medium">{unit.superficie} m²</span>
              </div>
              
              <div className="pt-2 flex flex-col gap-2">
                <div className="flex items-center text-gray-600">
                  <KeyIcon className="h-4 w-4 mr-2 text-orange-400 flex-shrink-0" />
                  <span className="text-xs uppercase tracking-wider font-semibold text-gray-400 w-24 flex-shrink-0">Proprietario:</span>
                  <span className="font-medium truncate">{getPersonName(unit.owner_id)}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <UserIcon className="h-4 w-4 mr-2 text-indigo-400 flex-shrink-0" />
                  <span className="text-xs uppercase tracking-wider font-semibold text-gray-400 w-24 flex-shrink-0">Inquilino:</span>
                  <span className="font-medium truncate">{getPersonName(unit.tenant_id)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {immobili.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
             {canCreateImmobile ? 
              'Nessuna unità trovata. Clicca su "Aggiungi Unità" per crearne una.' :
              'Nessuna unità immobiliare disponibile.'}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl transform transition-all">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-4">
              {editingUnit ? 'Modifica Unità' : 'Nuova Unità'}
            </h2>
            <UnitForm 
              initialData={editingUnit}
              condomini={condomini}
              people={anagrafiche}
              onSubmit={handleSave}
              onCancel={() => setIsModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};