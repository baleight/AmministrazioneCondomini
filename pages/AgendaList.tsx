import React, { useState, useMemo } from 'react';
import { db } from '../services/storage';
import { useData } from '../context/DataContext';
import { useNotification } from '../context/NotificationContext';
import { usePermissions } from '../hooks/usePermissions';
import { Evento } from '../types';
import { 
  CalendarDaysIcon, 
  PlusIcon, 
  TrashIcon, 
  ClockIcon, 
  MapPinIcon,
  FunnelIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export const AgendaList: React.FC = () => {
  const { agenda, condomini, refreshData } = useData();
  const { notify } = useNotification();
  const { canCreateEvent, canDeleteEvent } = usePermissions();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterCondo, setFilterCondo] = useState<string>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [newEvent, setNewEvent] = useState<Omit<Evento, 'id'>>({
    title: '',
    description: '',
    start_date: new Date().toISOString().slice(0, 16), // Format for datetime-local
    end_date: '',
    type: 'assemblea',
    condominio_id: undefined
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.start_date) return;

    setIsSubmitting(true);
    try {
      await db.insert<Evento>('agenda', newEvent);
      notify('success', 'Evento Creato', 'L\'evento è stato aggiunto all\'agenda.');
      setIsModalOpen(false);
      resetForm();
      await refreshData();
    } catch (err: any) {
      notify('error', 'Errore', 'Impossibile creare l\'evento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Vuoi davvero cancellare questo evento?')) {
      try {
        await db.delete('agenda', id);
        notify('success', 'Evento Eliminato', 'Evento rimosso correttamente.');
        await refreshData();
      } catch (err: any) {
        notify('error', 'Errore', 'Impossibile eliminare l\'evento.');
      }
    }
  };

  const resetForm = () => {
    setNewEvent({
      title: '',
      description: '',
      start_date: new Date().toISOString().slice(0, 16),
      end_date: '',
      type: 'assemblea',
      condominio_id: undefined
    });
  };

  // Processing & Filtering
  const sortedEvents = useMemo(() => {
    let filtered = [...agenda];
    
    // Filtro Condominio
    if (filterCondo !== 'all') {
      filtered = filtered.filter(e => e.condominio_id === parseInt(filterCondo) || !e.condominio_id);
    }

    // Sort by date (prossimi eventi prima)
    return filtered.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
  }, [agenda, filterCondo]);

  const getTypeStyle = (type: string) => {
    switch(type) {
      case 'assemblea': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'scadenza': return 'bg-red-100 text-red-800 border-red-200';
      case 'manutenzione': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('it-IT', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short', 
      hour: '2-digit', 
      minute: '2-digit' 
    }).format(date);
  };
  
  const getDayAndMonth = (isoString: string) => {
     const date = new Date(isoString);
     return {
         day: date.getDate(),
         month: date.toLocaleString('it-IT', { month: 'short' }).toUpperCase()
     };
  };

  const getCondoName = (id?: number) => {
    if (!id) return 'Generale';
    return condomini.find(c => c.id === id)?.nome || 'Sconosciuto';
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agenda Condominiale</h1>
          <p className="text-sm text-gray-500 mt-1">Assemblee, scadenze e interventi manutentivi</p>
        </div>
        
        {canCreateEvent && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <PlusIcon className="h-5 w-5" />
            Nuovo Evento
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex items-center gap-3">
         <FunnelIcon className="h-5 w-5 text-gray-400" />
         <span className="text-sm font-medium text-gray-700">Filtra:</span>
         <select
            value={filterCondo}
            onChange={(e) => setFilterCondo(e.target.value)}
            className="block w-full sm:w-64 rounded-md border-0 py-1.5 pl-3 pr-8 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
         >
           <option value="all">Tutti i Condomini</option>
           {condomini.map(c => (
             <option key={c.id} value={c.id}>{c.nome}</option>
           ))}
         </select>
      </div>

      {/* Timeline List */}
      <div className="space-y-4">
        {sortedEvents.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
            <CalendarDaysIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nessun evento in programma.</p>
          </div>
        ) : (
          sortedEvents.map((evt) => {
            const { day, month } = getDayAndMonth(evt.start_date);
            const isPast = new Date(evt.start_date) < new Date();
            
            return (
              <div key={evt.id} className={`bg-white rounded-xl shadow-sm border p-4 flex gap-4 transition-all hover:shadow-md ${isPast ? 'opacity-60 bg-gray-50 border-gray-100' : 'border-gray-200'}`}>
                {/* Date Box */}
                <div className="flex-shrink-0 w-16 flex flex-col items-center justify-center bg-gray-50 rounded-lg border border-gray-100 p-2">
                   <span className="text-xs font-bold text-gray-500">{month}</span>
                   <span className="text-2xl font-bold text-gray-900">{day}</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                   <div className="flex items-start justify-between">
                     <div>
                        <h3 className="text-lg font-bold text-gray-900 truncate pr-2">{evt.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium border uppercase tracking-wide ${getTypeStyle(evt.type)}`}>
                            {evt.type}
                          </span>
                          <span className="flex items-center text-xs text-gray-500">
                             <MapPinIcon className="h-3 w-3 mr-1" />
                             {getCondoName(evt.condominio_id)}
                          </span>
                        </div>
                     </div>
                     {canDeleteEvent && (
                        <button 
                          onClick={() => handleDelete(evt.id)}
                          className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                     )}
                   </div>
                   
                   <p className="text-sm text-gray-600 mt-2 line-clamp-2">{evt.description}</p>
                   
                   <div className="mt-3 flex items-center text-sm text-gray-500 font-medium">
                      <ClockIcon className="h-4 w-4 mr-1.5 text-indigo-500" />
                      {formatDate(evt.start_date)} 
                      {evt.end_date && ` - ${formatDate(evt.end_date).split(' ').slice(3).join(' ')}`} 
                      {isPast && <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">Passato</span>}
                   </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl transform transition-all animate-scale-in">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h2 className="text-xl font-bold text-gray-800">Nuovo Evento</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titolo</label>
                <input 
                  type="text"
                  required
                  value={newEvent.title}
                  onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="es. Assemblea Annuale"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Inizio</label>
                    <input 
                      type="datetime-local"
                      required
                      value={newEvent.start_date}
                      onChange={e => setNewEvent({...newEvent, start_date: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fine (Opzionale)</label>
                    <input 
                      type="datetime-local"
                      value={newEvent.end_date}
                      onChange={e => setNewEvent({...newEvent, end_date: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipologia</label>
                  <select
                    value={newEvent.type}
                    onChange={e => setNewEvent({...newEvent, type: e.target.value as any})}
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    <option value="assemblea">Assemblea</option>
                    <option value="manutenzione">Manutenzione</option>
                    <option value="scadenza">Scadenza</option>
                    <option value="altro">Altro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Condominio</label>
                  <select
                    value={newEvent.condominio_id || ''}
                    onChange={e => setNewEvent({...newEvent, condominio_id: e.target.value ? parseInt(e.target.value) : undefined})}
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    <option value="">Tutti / Generale</option>
                    {condomini.map(c => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione</label>
                <textarea 
                  rows={3}
                  value={newEvent.description}
                  onChange={e => setNewEvent({...newEvent, description: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  placeholder="Dettagli aggiuntivi..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 mt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  disabled={isSubmitting}
                >
                  Annulla
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? 'Salvataggio...' : 'Salva Evento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};