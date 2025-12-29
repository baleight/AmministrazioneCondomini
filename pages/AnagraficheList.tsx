import React, { useEffect, useState } from 'react';
import { db } from '../services/storage';
import { Anagrafica } from '../types';
import { AnagraficaForm } from '../components/AnagraficaForm';
import { 
  UserCircleIcon, 
  PhoneIcon, 
  EnvelopeIcon, 
  PlusIcon,
  PencilSquareIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

export const AnagraficheList: React.FC = () => {
  const [people, setPeople] = useState<Anagrafica[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Anagrafica | null>(null);

  const loadPeople = async () => {
    setLoading(true);
    try {
      const data = await db.select<Anagrafica>('anagrafiche');
      setPeople(data);
    } catch (error) {
      console.error("Error loading people:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPeople();
  }, []);

  const handleOpenModal = (person?: Anagrafica) => {
    setEditingPerson(person || null);
    setIsModalOpen(true);
  };

  const handleSave = async (data: Omit<Anagrafica, 'id'>) => {
    try {
      if (editingPerson) {
        await db.update<Anagrafica>('anagrafiche', editingPerson.id, data);
      } else {
        await db.insert<Anagrafica>('anagrafiche', data);
      }
      setIsModalOpen(false);
      setEditingPerson(null);
      loadPeople();
    } catch (err: any) {
      alert(`Errore durante il salvataggio: ${err.message}`);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Sei sicuro di voler eliminare questa anagrafica?')) {
      try {
        await db.delete('anagrafiche', id);
        loadPeople();
      } catch (err: any) {
        alert(`Errore durante l'eliminazione: ${err.message}`);
      }
    }
  };

  return (
    <div>
       <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Elenco Anagrafiche</h1>
          <p className="text-sm text-gray-500 mt-1">Gestisci proprietari, inquilini e contatti</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-all"
        >
          <PlusIcon className="h-5 w-5" />
          Nuova Anagrafica
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contatti</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ruolo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Codice Fiscale</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Azioni</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={5} className="p-6 text-center">Caricamento...</td></tr>
              ) : people.length === 0 ? (
                <tr><td colSpan={5} className="p-6 text-center text-gray-500">Nessuna anagrafica trovata.</td></tr>
              ) : people.map((person) => (
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
                      <EnvelopeIcon className="h-4 w-4 mr-1 text-gray-400" /> {person.email}
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                    {person.codice_fiscale}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => handleOpenModal(person)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                      title="Modifica"
                    >
                      <PencilSquareIcon className="h-5 w-5" />
                    </button>
                    <button 
                      onClick={() => handleDelete(person.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Elimina"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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