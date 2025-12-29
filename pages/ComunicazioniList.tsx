import React, { useState } from 'react';
import { draftCommunication } from '../services/gemini';
import { SparklesIcon, PaperAirplaneIcon, XMarkIcon } from '@heroicons/react/24/outline';

export const ComunicazioniList: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState<'formal' | 'friendly' | 'urgent'>('formal');
  const [draft, setDraft] = useState<{ title: string; content: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDraft = async () => {
    if (!topic) return;
    setLoading(true);
    const result = await draftCommunication(topic, tone);
    setDraft(result);
    setLoading(false);
  };

  const toneLabels = {
    formal: 'Formale',
    friendly: 'Amichevole',
    urgent: 'Urgente'
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Comunicazioni</h1>
        <p className="text-sm text-gray-500 mt-1">Invia avvisi e comunicazioni ai residenti</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Editor Side */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-fit">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <SparklesIcon className="h-5 w-5 text-indigo-500" />
            Assistente AI
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Argomento / Punti Chiave</label>
              <textarea 
                className="w-full border rounded-lg p-3 h-32 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                placeholder="es. Manutenzione ascensore martedì dalle 9:00 alle 14:00..."
                value={topic}
                onChange={e => setTopic(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tono</label>
              <div className="flex gap-2">
                {['formal', 'friendly', 'urgent'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTone(t as any)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize border transition-colors ${
                      tone === t 
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
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
              disabled={loading || !topic}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

        {/* Preview Side */}
        <div className="space-y-4">
          {draft ? (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden ring-1 ring-black/5">
               <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                 <h3 className="font-semibold text-gray-900">Anteprima</h3>
                 <button onClick={() => setDraft(null)} className="text-gray-400 hover:text-gray-600">
                   <XMarkIcon className="h-5 w-5" />
                 </button>
               </div>
               <div className="p-6">
                 <div className="mb-4">
                   <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Oggetto</span>
                   <div className="text-lg font-bold text-gray-900 mt-1">{draft.title}</div>
                 </div>
                 <div>
                   <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Messaggio</span>
                   <div className="mt-2 text-gray-700 whitespace-pre-wrap leading-relaxed">
                     {draft.content}
                   </div>
                 </div>
               </div>
               <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
                 <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium flex items-center justify-center gap-2">
                   <PaperAirplaneIcon className="h-5 w-5" />
                   Approva & Invia
                 </button>
               </div>
            </div>
          ) : (
            <div className="h-full min-h-[300px] border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-center p-8 text-gray-400">
               <SparklesIcon className="h-12 w-12 mb-4 text-gray-200" />
               <p>La tua bozza generata dall'IA<br/>apparirà qui.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};