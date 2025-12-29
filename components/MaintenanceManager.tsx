import React, { useState } from 'react';
import { db } from '../services/storage';
import { useData } from '../context/DataContext';
import { useNotification } from '../context/NotificationContext';
import { usePermissions } from '../hooks/usePermissions';
import { analyzeTicket } from '../services/gemini';
import { Segnalazione } from '../types';
import { SegnalazioneForm } from './SegnalazioneForm';
import { 
  SparklesIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';

export const MaintenanceManager: React.FC = () => {
  const { segnalazioni, condomini, refreshData } = useData();
  const { notify } = useNotification();
  const { canDeleteTicket, isStaff, canManageTicketStatus } = usePermissions();
  const [analyzingId, setAnalyzingId] = useState<number | null>(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Segnalazione | null>(null);

  // Sort localmente
  const sortedTickets = [...segnalazioni].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // CRUD Actions
  const handleOpenModal = (ticket?: Segnalazione) => {
    setEditingTicket(ticket || null);
    setIsModalOpen(true);
  };

  const handleSave = async (data: Omit<Segnalazione, 'id' | 'created_at' | 'ai_analysis'>) => {
    try {
      if (editingTicket) {
        await db.update<Segnalazione>('segnalazioni', editingTicket.id, data);
        notify('success', 'Aggiornamento Completato', 'La segnalazione è stata modificata con successo.');
      } else {
        const newTicket = {
          ...data,
          created_at: new Date().toISOString(),
          ai_analysis: '' // Start empty
        };
        await db.insert<Segnalazione>('segnalazioni', newTicket);
        notify('success', 'Segnalazione Creata', 'La nuova richiesta di manutenzione è stata registrata.');
      }
      setIsModalOpen(false);
      setEditingTicket(null);
      await refreshData();
    } catch (err) {
      notify('error', 'Errore Salvataggio', 'Non è stato possibile salvare la segnalazione.');
    }
  };

  const handleStatusChange = async (id: number, newStatus: 'open' | 'in_progress' | 'resolved') => {
    try {
      await db.update<Segnalazione>('segnalazioni', id, { status: newStatus });
      await refreshData();
      notify('info', 'Stato Aggiornato', `Lo stato della segnalazione è ora: ${translateStatus(newStatus)}`);
    } catch (err) {
      notify('error', 'Errore Aggiornamento', "Impossibile aggiornare lo stato.");
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Sei sicuro di voler eliminare questa segnalazione?')) {
      try {
        await db.delete('segnalazioni', id);
        await refreshData();
        notify('warning', 'Segnalazione Eliminata', 'La segnalazione è stata rimossa dal sistema.');
      } catch (err) {
        notify('error', 'Errore Eliminazione', "Impossibile eliminare la segnalazione.");
      }
    }
  };

  // AI Logic
  const handleAnalyze = async (ticket: Segnalazione) => {
    setAnalyzingId(ticket.id);
    try {
      const analysis = await analyzeTicket(ticket.title, ticket.description);
      
      // Update local DB
      await db.update<Segnalazione>('segnalazioni', ticket.id, { ai_analysis: analysis });
      await refreshData();
      notify('success', 'Analisi Completata', 'Gemini ha analizzato la segnalazione con successo.');
    } catch (e) {
      notify('error', 'Analisi Fallita', 'Impossibile completare l\'analisi AI.');
    } finally {
      setAnalyzingId(null);
    }
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

  const getStatusStyles = (s: string) => {
    switch (s) {
        case 'resolved': return 'bg-green-50 text-green-700 ring-green-600/20 border-green-200';
        case 'in_progress': return 'bg-blue-50 text-blue-700 ring-blue-600/20 border-blue-200';
        default: return 'bg-gray-50 text-gray-600 ring-gray-500/10 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           {/* Header is typically handled by parent, but we include controls here */}
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 shadow-sm transition-all"
        >
          <PlusIcon className="h-5 w-5" />
          Nuova Segnalazione
        </button>
      </div>

      <div className="space-y-4">
        {sortedTickets.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
            Nessuna segnalazione attiva.
          </div>
        ) : (
          sortedTickets.map(ticket => (
            <div key={ticket.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all hover:shadow-md relative group">
              
              {/* Actions Top Right */}
              <div className="absolute top-4 right-4 flex gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleOpenModal(ticket)}
                  className="p-1.5 text-gray-400 hover:text-indigo-600 bg-white border border-gray-200 rounded hover:bg-gray-50 shadow-sm"
                  title="Modifica"
                >
                  <PencilSquareIcon className="h-4 w-4" />
                </button>
                
                {canDeleteTicket && (
                  <button 
                    onClick={() => handleDelete(ticket.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 bg-white border border-gray-200 rounded hover:bg-gray-50 shadow-sm"
                    title="Elimina"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="flex flex-col md:flex-row justify-between items-start gap-4 pr-16 md:pr-0">
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
                  {canManageTicketStatus ? (
                    <select
                      value={ticket.status}
                      onChange={(e) => handleStatusChange(ticket.id, e.target.value as any)}
                      className={`block w-full rounded-full py-1.5 pl-3 pr-8 text-sm font-medium border-0 ring-1 ring-inset focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6 cursor-pointer outline-none transition-colors ${getStatusStyles(ticket.status)}`}
                    >
                      <option value="open">Aperto</option>
                      <option value="in_progress">In Corso</option>
                      <option value="resolved">Risolto</option>
                    </select>
                  ) : (
                    <span className={`flex items-center text-sm font-medium px-3 py-1 rounded-full border ${getStatusStyles(ticket.status)}`}>
                      {ticket.status === 'resolved' && <CheckCircleIcon className="h-4 w-4 mr-1" />}
                      {translateStatus(ticket.status)}
                    </span>
                  )}
                </div>
              </div>

              {/* AI Analysis Section */}
              {isStaff && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  {ticket.ai_analysis ? (
                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-100 relative">
                      <div className="flex items-center gap-2 mb-2">
                          <SparklesIcon className="h-5 w-5 text-purple-600" />
                          <h4 className="text-sm font-bold text-purple-900">Analisi Gemini (Staff Only)</h4>
                      </div>
                      <p className="text-sm text-purple-800 whitespace-pre-wrap leading-relaxed">
                        {ticket.ai_analysis}
                      </p>
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
                          Analizza Priorità (Staff)
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 backdrop-blur-sm">
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