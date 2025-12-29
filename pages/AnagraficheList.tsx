import React, { useState } from 'react';
import { db } from '../services/storage';
import { useData } from '../context/DataContext';
import { useNotification } from '../context/NotificationContext';
import { usePermissions } from '../hooks/usePermissions';
import { Anagrafica } from '../types';
import { AnagraficaForm } from '../components/AnagraficaForm';
import { 
  UserCircleIcon, 
  PhoneIcon, 
  EnvelopeIcon, 
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export const AnagraficheList: React.FC = () => {
  const { anagrafiche, refreshData } = useData();
  const { notify } = useNotification();
  const { canCreateAnagrafica, canEditAnagrafica, canDeleteAnagrafica } = usePermissions();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Anagrafica | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'owner' | 'tenant'>('all');

  const handleOpenModal = (person?: Anagrafica) => {
    setEditingPerson(person || null);
    setIsModalOpen(true);
  };

  const handleSave = async (data: Omit<Anagrafica, 'id'>) => {
    try {
      if (editingPerson) {
        await db.update<Anagrafica>('anagrafiche', editingPerson.id, data);
        notify('success', 'Anagrafica Aggiornata', 'I dati sono stati salvati correttamente.');
      } else {
        await db.insert<Anagrafica>('anagrafiche', data);
        notify('success', 'Nuova Anagrafica', 'Persona aggiunta con successo.');
      }
      setIsModalOpen(false);
      setEditingPerson(null);
      await refreshData();
    } catch (err: any) {
      notify('error', 'Errore', `Impossibile salvare: ${err.message}`);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Sei sicuro di voler eliminare questa anagrafica?')) {
      try {
        await db.delete('anagrafiche', id);
        await refreshData();
        notify('warning', 'Eliminazione', 'Anagrafica rimossa dal database.');
      } catch (err: any) {
        notify('error', 'Errore', `Impossibile eliminare: ${err.message}`);
      }
    }
  };

  const filteredPeople = anagrafiche.filter(person => {
    const term = searchTerm.toLowerCase();
    const roleIt = person.role === 'owner' ? 'proprietario' : 'inquilino';
    
    const matchesSearch = (
      person.nome.toLowerCase().includes(term) ||
      person.email.toLowerCase().includes(term) ||
      person.role.toLowerCase().includes(term) ||
      roleIt.includes(term) ||
      person.codice_fiscale.toLowerCase().includes(term)
    );

    const matchesRole = filterRole === 'all' || person.role === filterRole;

    return matchesSearch && matchesRole;
  });

  return (
    <div>
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Elenco Anagrafiche</h1>
          <p className="text-sm text-gray-500 mt-1">Gestisci proprietari, inquilini e contatti</p>
        </div>
        
        {canCreateAnagrafica && (
          <button 
            onClick={() => handleOpenModal()}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all whitespace-nowrap"
          >
            <PlusIcon className="h-5 w-5" />
            Nuova Anagrafica
          </button>
        )}
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative rounded-md shadow-sm flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            className="block w-full rounded-md border-0 py-2.5 pl-10 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            placeholder="Cerca per nome, email, ruolo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <XMarkIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="w-full sm:w-48 relative">
           <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <FunnelIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value as 'all' | 'owner' | 'tenant')}
            className="block w-full rounded-md border-0 py-2.5 pl-10 pr-8 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 cursor-pointer appearance-none bg-white"
          >
            <option value="all">Tutti i Ruoli</option>
            <option value="owner">Solo Proprietari</option>
            <option value="tenant">Solo Inquilini</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contatti</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ruolo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Codice Fiscale</th>
                { (canEditAnagrafica || canDeleteAnagrafica) && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Azioni</th> }
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {anagrafiche.length === 0 ? (
                <tr><td colSpan={5} className="p-6 text-center text-gray-500">Nessuna anagrafica trovata.</td></tr>
              ) : filteredPeople.length === 0 ? (
                <tr><td colSpan={5} className="p-6 text-center text-gray-500">
                   Nessun risultato per i filtri selezionati.
                </td></tr>
              ) : filteredPeople.map((person) => (
                <tr key={person.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <UserCircleIcon className="h-10 w-10 text-gray-300" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{person.nome}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 flex items-center">
                      <EnvelopeIcon className="h-4 w-4 mr-1 text-gray-400" /> 
                      <span className="truncate max-w-[120px] sm:max-w-none">{person.email}</span>
                    </div>
                    {person.telefono && (
                      <div className="text-sm text-gray-500 flex items-center mt-1">
                        <PhoneIcon className="h-4 w-4 mr-1 text-gray-400" /> {person.telefono}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      person.role === 'owner' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {person.role === 'owner' ? 'Proprietario' : person.role === 'tenant' ? 'Inquilino' : person.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono hidden sm:table-cell">
                    {person.codice_fiscale}
                  </td>
                  
                  { (canEditAnagrafica || canDeleteAnagrafica) && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-3">
                          {canEditAnagrafica && (
                            <button 
                              onClick={() => handleOpenModal(person)}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Modifica"
                            >
                              <PencilSquareIcon className="h-5 w-5" />
                            </button>
                          )}
                          {canDeleteAnagrafica && (
                            <button 
                              onClick={() => handleDelete(person.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Elimina"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl transform transition-all">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-4">
              {editingPerson ? 'Modifica Anagrafica' : 'Nuova Anagrafica'}
            </h2>
            <AnagraficaForm 
              initialData={editingPerson}
              onSubmit={handleSave}
              onCancel={() => setIsModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};