import React, { useState } from 'react';
import { db } from '../services/storage';
import { useData } from '../context/DataContext';
import { analyzeTicket } from '../services/gemini';
import { Segnalazione } from '../types';
import { SegnalazioneForm } from '../components/SegnalazioneForm';
import { 
  SparklesIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';

export const SegnalazioniList: React.FC = () => {
  const { segnalazioni, condomini, refreshData } = useData();
  const [analyzingId, setAnalyzingId] = useState<number | null>(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Segnalazione | null>(null);

  // Sort localmente, i dati grezzi sono nel contesto
  const sortedTickets = [...segnalazioni].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // CRUD Actions
  const handleOpenModal = (ticket?: Segnalazione) => {
    setEditingTicket(ticket || null);
    setIsModalOpen(true);
  };

  const handleSave = async (data: Omit<Segnalazione, 'id' | 'created_at' | 'ai_analysis'>) => {
    if (editingTicket) {
      await db.update<Segnalazione>('segnalazioni', editingTicket.id, data);
    } else {
      const newTicket = {
        ...data,
        created_at: new Date().toISOString(),
        ai_analysis: '' // Start empty
      };
      await db.insert<Segnalazione>('segnalazioni', newTicket);
    }
    setIsModalOpen(false);
    setEditingTicket(null);
    await refreshData();
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Sei sicuro di voler eliminare questa segnalazione?')) {
      try {
        await db.delete('segnalazioni', id);
        await refreshData();
      } catch (err) {
        alert("Errore durante l'eliminazione.");
      }
    }
  };

  // AI Logic
  const handleAnalyze = async (ticket: Segnalazione) => {
    setAnalyzingId(ticket.id);
    const analysis = await analyzeTicket(ticket.title, ticket.description);
    
    // Update local DB
    await db.update<Segnalazione>('segnalazioni', ticket.id, { ai_analysis: analysis });
    await refreshData();
    setAnalyzingId(null);
  };

  // UI Helpers
  const getCondoName = (id: number) => condomini.find(c => c.id === id)?.nome || 'Condominio sconosciuto';

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'high': return 'text-red-700 bg-red-50 ring-red-600/20';
      case 'medium': return 'text-yellow-700 bg-yellow-50 ring-yellow-600/20';
      default: return 'text-green-700 bg-green-50 ring-green-600/20';
    }
  };

  const translatePriority = (p: string) => {
    switch (p) {
        case 'high': return 'Alta';
        case 'medium': return 'Media';
        case 'low': return 'Bassa';
        default: return p;
    }
  };

  const translateStatus = (s: string) => {
      switch (s) {
          case 'open': return 'Aperto';
          case 'in_progress': return 'In Corso';
          case 'resolved': return 'Risolto';
          default: return s;
      }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Segnalazioni Manutenzione</h1>
          <p className="text-sm text-gray-500 mt-1">Monitora e risolvi i problemi degli edifici</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-all"
        >
          <PlusIcon className="h-5 w-5" />
          Nuova Segnalazione
        </button>
      </div>

      <div className="space-y-6">
        {sortedTickets.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
            Nessuna segnalazione attiva.
          </div>
        ) : (
          sortedTickets.map(ticket => (
            <div key={ticket.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all hover:shadow-md relative group">
              
              {/* Actions Top Right */}
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleOpenModal(ticket)}
                  className="p-1.5 text-gray-400 hover:text-indigo-600 bg-white border border-gray-200 rounded hover:bg-gray-50 shadow-sm"
                  title="Modifica"
                >
                  <PencilSquareIcon className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => handleDelete(ticket.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 bg-white border border-gray-200 rounded hover:bg-gray-50 shadow-sm"
                  title="Elimina"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>

              <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-gray-900">{ticket.title}</h3>
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getPriorityColor(ticket.priority)}`}>
                      {translatePriority(ticket.priority)}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                      <MapPinIcon className="h-3 w-3 mr-1" />
                      {getCondoName(ticket.condominio_id)}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-4 leading-relaxed">{ticket.description}</p>
                  <div className="flex items-center text-xs text-gray-400">
                    <ClockIcon className="h-3.5 w-3.5 mr-1" />
                    Creata il: {new Date(ticket.created_at).toLocaleString()}
                  </div>
                </div>
                
                <div className="flex-shrink-0 flex items-center self-start md:self-center">
                  {ticket.status === 'resolved' ? (
                    <span className="flex items-center text-green-700 text-sm font-medium bg-green-50 border border-green-200 px-3 py-1 rounded-full">
                      <CheckCircleIcon className="h-4 w-4 mr-1" /> Risolto
                    </span>
                  ) : (
                    <span className={`text-sm font-medium px-3 py-1 rounded-full border ${
                      ticket.status === 'in_progress' 
                        ? 'bg-blue-50 text-blue-700 border-blue-200' 
                        : 'bg-gray-100 text-gray-600 border-gray-200'
                    }`}>
                      {translateStatus(ticket.status)}
                    </span>
                  )}
                </div>
              </div>

              {/* AI Analysis Section */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                {ticket.ai_analysis ? (
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-100 relative">
                    <div className="flex items-center gap-2 mb-2">
                        <SparklesIcon className="h-5 w-5 text-purple-600" />
                        <h4 className="text-sm font-bold text-purple-900">Analisi Gemini</h4>
                    </div>
                    <p className="text-sm text-purple-800 whitespace-pre-wrap leading-relaxed">
                      {ticket.ai_analysis}
                    </p>
                    {/* Button to re-analyze if needed */}
                    <button 
                        onClick={() => handleAnalyze(ticket)}
                        className="absolute top-4 right-4 text-xs text-purple-400 hover:text-purple-700 underline"
                    >
                      Aggiorna
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => handleAnalyze(ticket)}
                    disabled={analyzingId === ticket.id}
                    className="flex items-center gap-2 text-sm text-indigo-600 font-medium hover:text-indigo-800 disabled:opacity-50 transition-colors"
                  >
                    {analyzingId === ticket.id ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
                        Analisi con Gemini in corso...
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="h-4 w-4" />
                        Analizza Priorità & Suggerisci Azione
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl transform transition-all">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-4">
              {editingTicket ? 'Modifica Segnalazione' : 'Nuova Segnalazione'}
            </h2>
            <SegnalazioneForm 
              initialData={editingTicket}
              condomini={condomini}
              onSubmit={handleSave}
              onCancel={() => setIsModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};