import React, { useState } from 'react';
import { draftCommunication } from '../services/gemini';
import { useNotification } from '../context/NotificationContext';
import { ComunicazioneEditor } from '../components/ComunicazioneEditor';
import { SparklesIcon, PencilSquareIcon } from '@heroicons/react/24/outline';

export const ComunicazioniList: React.FC = () => {
  const { notify } = useNotification();
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState<'formal' | 'friendly' | 'urgent'>('formal');
  
  // State for the editor
  const [draft, setDraft] = useState<{ title: string; content: string } | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDraft = async () => {
    if (!topic) return;
    setLoading(true);
    try {
      const result = await draftCommunication(topic, tone);
      setDraft(result);
      setIsEditorOpen(true);
      notify('success', 'Bozza Generata', 'L\'intelligenza artificiale ha creato una nuova bozza.');
    } catch (e) {
      notify('error', 'Errore IA', 'Impossibile generare la bozza.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualStart = () => {
    setDraft({ title: '', content: '' });
    setIsEditorOpen(true);
  };

  const handleSaveToBoard = (data: { title: string; content: string }) => {
    // In una vera app, qui salveremmo su 'comunicazioni' nel DB
    notify('info', 'Pubblicazione Riuscita', `La comunicazione "${data.title}" è stata pubblicata in bacheca.`);
    
    // Reset
    setDraft(null);
    setIsEditorOpen(false);
    setTopic('');
  };

  const handleSendEmail = (data: { title: string; content: string }) => {
    // Simulazione invio email
    notify('success', 'Email Inviata', `Il messaggio "${data.title}" è stato inviato a tutti i destinatari.`);
    
    // Reset
    setDraft(null);
    setIsEditorOpen(false);
    setTopic('');
  };

  const toneLabels = {
    formal: 'Formale',
    friendly: 'Amichevole',
    urgent: 'Urgente'
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Comunicazioni</h1>
          <p className="text-sm text-gray-500 mt-1">Invia avvisi e comunicazioni ai residenti</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Input Methods */}
        <div className="space-y-6">
           {/* AI Assistant Card */}
           <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800">
                <SparklesIcon className="h-5 w-5 text-indigo-500" />
                Assistente AI
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Argomento / Punti Chiave</label>
                  <textarea 
                    className="w-full border border-gray-300 rounded-lg p-3 h-32 focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-all"
                    placeholder="es. Manutenzione ascensore martedì dalle 9:00 alle 14:00..."
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    disabled={isEditorOpen}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tono Desiderato</label>
                  <div className="flex gap-2">
                    {['formal', 'friendly', 'urgent'].map((t) => (
                      <button
                        key={t}
                        onClick={() => setTone(t as any)}
                        disabled={isEditorOpen}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize border transition-all ${
                          tone === t 
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700 ring-1 ring-indigo-200' 
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {toneLabels[t as keyof typeof toneLabels]}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleDraft}
                  disabled={loading || !topic || isEditorOpen}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Generazione in corso...
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="h-5 w-5" />
                      Genera Bozza con Gemini
                    </>
                  )}
                </button>
              </div>
           </div>

           <div className="relative">
             <div className="absolute inset-0 flex items-center" aria-hidden="true">
               <div className="w-full border-t border-gray-200" />
             </div>
             <div className="relative flex justify-center">
               <span className="bg-gray-50 px-2 text-sm text-gray-500">oppure</span>
             </div>
           </div>

           {/* Manual Option */}
           <button
             onClick={handleManualStart}
             disabled={isEditorOpen}
             className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
           >
             <PencilSquareIcon className="h-5 w-5 text-gray-500" />
             Scrivi Manualmente
           </button>
        </div>

        {/* Right Column: Editor or Empty State */}
        <div className="h-full">
          {isEditorOpen ? (
            <ComunicazioneEditor 
              initialData={draft} 
              onSave={handleSaveToBoard}
              onSendEmail={handleSendEmail}
              onCancel={() => {
                setIsEditorOpen(false);
                setDraft(null);
              }} 
            />
          ) : (
            <div className="h-full min-h-[400px] border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-center p-8 text-gray-400 bg-white/50">
               <div className="bg-gray-100 p-4 rounded-full mb-4">
                 <SparklesIcon className="h-8 w-8 text-gray-400" />
               </div>
               <h3 className="text-lg font-medium text-gray-900">Area di Lavoro</h3>
               <p className="mt-1 max-w-xs mx-auto">
                 Genera una bozza con l'IA o inizia a scrivere manualmente per vedere l'editor qui.
               </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};