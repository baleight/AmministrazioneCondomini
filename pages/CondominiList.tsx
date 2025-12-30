import React, { useState, useMemo, useRef } from 'react';
import { db } from '../services/storage';
import { useData } from '../context/DataContext';
import { useNotification } from '../context/NotificationContext';
import { usePermissions } from '../hooks/usePermissions';
import { Condominio } from '../types';
import { CondominioForm } from '../components/CondominioForm';
import { jsonToCsv, downloadCsv, csvToJson } from '../services/csvUtils';
import { 
  PlusIcon, 
  MapPinIcon, 
  HomeModernIcon, 
  PencilSquareIcon, 
  TrashIcon, 
  FunnelIcon,
  ArrowsUpDownIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon
} from '@heroicons/react/24/outline';

export const CondominiList: React.FC = () => {
  const { condomini, refreshData } = useData();
  const { notify } = useNotification();
  const { canCreateCondominio, canEditCondominio, canDeleteCondominio, isAdmin } = usePermissions();
  
  // Stati per filtri e ordinamento
  const [filterCity, setFilterCity] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCondo, setEditingCondo] = useState<Condominio | null>(null);
  
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calcolo delle città uniche per il menu a tendina
  const uniqueCities = useMemo(() => {
    const cities = condomini.map(i => i.city).filter(c => c && c.trim() !== '');
    return Array.from(new Set(cities)).sort();
  }, [condomini]);

  // Logica di filtraggio e ordinamento
  const processedItems = useMemo(() => {
    let result = [...condomini];

    if (filterCity) {
      result = result.filter(item => item.city === filterCity);
    }

    result.sort((a, b) => {
      const compare = a.nome.localeCompare(b.nome);
      return sortOrder === 'asc' ? compare : -compare;
    });

    return result;
  }, [condomini, filterCity, sortOrder]);

  const handleOpenModal = (condo?: Condominio) => {
    setEditingCondo(condo || null);
    setIsModalOpen(true);
  };

  const handleSave = async (data: Omit<Condominio, 'id'>) => {
    try {
      if (editingCondo) {
        await db.update<Condominio>('condomini', editingCondo.id, data);
        notify('success', 'Condominio Modificato', 'I dati sono stati aggiornati correttamente.');
      } else {
        await db.insert<Condominio>('condomini', data);
        notify('success', 'Condominio Creato', 'Nuovo condominio aggiunto al portafoglio.');
      }
      setIsModalOpen(false);
      setEditingCondo(null);
      await refreshData();
    } catch (err: any) {
      notify('error', 'Errore', `Impossibile salvare: ${err.message}`);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Sei sicuro di voler eliminare questo condominio? Questa azione non può essere annullata.')) {
      try {
        await db.delete('condomini', id);
        await refreshData();
        notify('warning', 'Eliminato', 'Condominio rimosso con successo.');
      } catch (err: any) {
        notify('error', 'Errore', `Impossibile eliminare: ${err.message}`);
      }
    }
  };

  // --- Export / Import Logic ---
  const handleExport = () => {
    const csv = jsonToCsv(condomini);
    const date = new Date().toISOString().split('T')[0];
    downloadCsv(csv, `condomini_export_${date}`);
    notify('success', 'Export Completato', 'File CSV scaricato.');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const jsonData = csvToJson(text);

        if (jsonData.length === 0) throw new Error("File vuoto o non valido.");

        let successCount = 0;
        let errorCount = 0;

        for (const row of jsonData) {
            try {
                const { id, ...dataToInsert } = row;
                if (!dataToInsert.nome || !dataToInsert.indirizzo) {
                    errorCount++;
                    continue;
                }
                await db.insert<Condominio>('condomini', dataToInsert as Omit<Condominio, 'id'>);
                successCount++;
            } catch (err) {
                errorCount++;
            }
        }

        await refreshData();
        notify(
            errorCount > 0 ? 'warning' : 'success', 
            'Importazione Terminata', 
            `Importati: ${successCount}. Errori: ${errorCount}.`
        );
      } catch (err: any) {
        notify('error', 'Errore Import', err.message);
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div>
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Condomini</h1>
          <p className="text-sm text-gray-500 mt-1">Gestisci il tuo portafoglio immobiliare</p>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          {/* Export */}
          {(canEditCondominio) && (
             <button
                onClick={handleExport}
                className="flex-1 lg:flex-none bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all whitespace-nowrap text-sm font-medium"
             >
                <ArrowDownTrayIcon className="h-5 w-5" />
                Export CSV
             </button>
          )}

          {/* Import */}
          {isAdmin && (
            <>
                <input 
                    type="file" 
                    accept=".csv" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileChange} 
                />
                <button
                    onClick={handleImportClick}
                    disabled={isImporting}
                    className="flex-1 lg:flex-none bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all whitespace-nowrap text-sm font-medium disabled:opacity-50"
                >
                    {isImporting ? (
                        <div className="animate-spin h-5 w-5 border-2 border-gray-500 border-t-transparent rounded-full" />
                    ) : (
                        <ArrowUpTrayIcon className="h-5 w-5" />
                    )}
                    Import CSV
                </button>
            </>
          )}

          {canCreateCondominio && (
            <button 
                onClick={() => handleOpenModal()}
                className="flex-1 lg:flex-none bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all whitespace-nowrap text-sm font-medium"
            >
                <PlusIcon className="h-5 w-5" />
                Aggiungi Condominio
            </button>
          )}
        </div>
      </div>

      {/* Toolbar Filtri e Ordinamento */}
      {condomini.length > 0 && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Filtra per:</span>
            <select 
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              className="block w-full sm:w-48 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
            >
              <option value="">Tutte le città</option>
              {uniqueCities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          <div className="h-px w-full bg-gray-200 sm:h-6 sm:w-px sm:block"></div>

          <button 
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            className="flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-indigo-600 font-medium transition-colors w-full sm:w-auto"
          >
            <ArrowsUpDownIcon className="h-4 w-4" />
            Ordina ({sortOrder === 'asc' ? 'A-Z' : 'Z-A'})
          </button>
          
          <div className="flex-1 text-center sm:text-right text-xs text-gray-400 w-full sm:w-auto">
            {processedItems.length} risultati
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {processedItems.map(condo => (
          <div key={condo.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group relative">
            <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-500 relative">
              <div className="absolute -bottom-6 left-6 p-2 bg-white rounded-lg shadow-sm">
                 <HomeModernIcon className="h-8 w-8 text-indigo-600" />
              </div>
              
              {/* Action Buttons Overlay - Visibili solo a chi ha permessi */}
              {(canEditCondominio || canDeleteCondominio) && (
                <div className="absolute top-4 right-4 flex gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  {canEditCondominio && (
                    <button 
                      onClick={() => handleOpenModal(condo)}
                      className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/40 text-white transition-colors"
                      title="Modifica Condominio"
                    >
                      <PencilSquareIcon className="h-5 w-5" />
                    </button>
                  )}
                  {canDeleteCondominio && (
                    <button 
                      onClick={() => handleDelete(condo.id)}
                      className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-red-500/80 text-white transition-colors"
                      title="Elimina Condominio"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              )}
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
        
        {condomini.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
            {canCreateCondominio ? 
              'Nessun condominio trovato. Clicca su "Aggiungi Condominio" per crearne uno.' : 
              'Nessun condominio disponibile.'}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
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