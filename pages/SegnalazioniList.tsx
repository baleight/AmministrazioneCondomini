import React, { useEffect, useState } from 'react';
import { db } from '../services/storage';
import { analyzeTicket } from '../services/gemini';
import { Segnalazione } from '../types';
import { SparklesIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

export const SegnalazioniList: React.FC = () => {
  const [tickets, setTickets] = useState<Segnalazione[]>([]);
  const [analyzingId, setAnalyzingId] = useState<number | null>(null);

  const loadTickets = () => {
    db.select<Segnalazione>('segnalazioni').then(setTickets);
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleAnalyze = async (ticket: Segnalazione) => {
    setAnalyzingId(ticket.id);
    const analysis = await analyzeTicket(ticket.title, ticket.description);
    
    // Update local DB
    await db.update<Segnalazione>('segnalazioni', ticket.id, { ai_analysis: analysis });
    loadTickets();
    setAnalyzingId(null);
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'high': return 'text-red-600 bg-red-50 ring-red-500/10';
      case 'medium': return 'text-yellow-600 bg-yellow-50 ring-yellow-500/10';
      default: return 'text-green-600 bg-green-50 ring-green-500/10';
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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Segnalazioni Manutenzione</h1>
          <p className="text-sm text-gray-500 mt-1">Monitora e risolvi i problemi degli edifici</p>
        </div>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
          Nuova Segnalazione
        </button>
      </div>

      <div className="space-y-6">
        {tickets.map(ticket => (
          <div key={ticket.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all hover:shadow-md">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-bold text-gray-900">{ticket.title}</h3>
                  <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getPriorityColor(ticket.priority)}`}>
                    {translatePriority(ticket.priority)}
                  </span>
                  <span className="text-xs text-gray-400 flex items-center">
                    <ClockIcon className="h-3 w-3 mr-1" />
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-4">{ticket.description}</p>
              </div>
              
              <div className="flex items-center">
                {ticket.status === 'resolved' ? (
                  <span className="flex items-center text-green-600 text-sm font-medium bg-green-50 px-3 py-1 rounded-full">
                    <CheckCircleIcon className="h-4 w-4 mr-1" /> Risolto
                  </span>
                ) : (
                  <span className="text-gray-500 text-sm bg-gray-100 px-3 py-1 rounded-full">
                    {translateStatus(ticket.status)}
                  </span>
                )}
              </div>
            </div>

            {/* AI Analysis Section */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              {ticket.ai_analysis ? (
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                  <div className="flex items-center gap-2 mb-2">
                     <SparklesIcon className="h-5 w-5 text-purple-600" />
                     <h4 className="text-sm font-bold text-purple-900">Analisi Gemini</h4>
                  </div>
                  <p className="text-sm text-purple-800 whitespace-pre-wrap leading-relaxed">
                    {ticket.ai_analysis}
                  </p>
                </div>
              ) : (
                <button 
                  onClick={() => handleAnalyze(ticket)}
                  disabled={analyzingId === ticket.id}
                  className="flex items-center gap-2 text-sm text-indigo-600 font-medium hover:text-indigo-800 disabled:opacity-50"
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
        ))}
      </div>
    </div>
  );
};