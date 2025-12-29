import React, { useEffect, useState } from 'react';
import { db } from '../services/storage';
import { Condominio } from '../types';
import { CondominioForm } from '../components/CondominioForm';
import { PlusIcon, MapPinIcon, HomeModernIcon, PencilSquareIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

export const CondominiList: React.FC = () => {
  const [items, setItems] = useState<Condominio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCondo, setEditingCondo] = useState<Condominio | null>(null);

  const loadItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await db.select<Condominio>('condomini');
      setItems(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Impossibile caricare gli edifici. Controlla la connessione o la configurazione.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleOpenModal = (condo?: Condominio) => {
    setEditingCondo(condo || null);
    setIsModalOpen(true);
  };

  const handleSave = async (data: Omit<Condominio, 'id'>) => {
    try {
      if (editingCondo) {
        await db.update<Condominio>('condomini', editingCondo.id, data);
      } else {
        await db.insert<Condominio>('condomini', data);
      }
      setIsModalOpen(false);
      setEditingCondo(null);
      loadItems();
    } catch (err: any) {
      alert(`Errore durante il salvataggio: ${err.message}`);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <ExclamationCircleIcon className="h-16 w-16 text-red-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Impossibile caricare i dati</h3>
        <p className="text-gray-500 max-w-md mt-2 mb-6">{error}</p>
        <button 
          onClick={loadItems}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          Riprova
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Condomini</h1>
          <p className="text-sm text-gray-500 mt-1">Gestisci il tuo portafoglio immobiliare</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-all"
        >
          <PlusIcon className="h-5 w-5" />
          Aggiungi Condominio
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(condo => (
            <div key={condo.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group">
              <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-500 relative">
                <div className="absolute -bottom-6 left-6 p-2 bg-white rounded-lg shadow-sm">
                   <HomeModernIcon className="h-8 w-8 text-indigo-600" />
                </div>
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleOpenModal(condo)}
                    className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/40 text-white transition-colors"
                    title="Modifica Condominio"
                  >
                    <PencilSquareIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="pt-8 p-6">
                <h3 className="text-lg font-bold text-gray-900">{condo.nome}</h3>
                <div className="flex items-center text-gray-500 mt-2 text-sm">
                  <MapPinIcon className="h-4 w-4 mr-1" />
                  {condo.indirizzo}, {condo.city}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                   <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-1 rounded">
                     {condo.units_count} Unità
                   </span>
                   <div className="flex gap-2">
                     <span className="text-xs text-gray-400 font-mono bg-gray-50 px-1 rounded">
                       {condo.codice_fiscale}
                     </span>
                   </div>
                </div>
              </div>
            </div>
          ))}
          
          {items.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
              Nessun condominio trovato. Clicca su "Aggiungi Condominio" per crearne uno.
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl transform transition-all">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-4">
              {editingCondo ? 'Modifica Condominio' : 'Nuovo Condominio'}
            </h2>
            <CondominioForm 
              initialData={editingCondo}
              onSubmit={handleSave}
              onCancel={() => setIsModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};