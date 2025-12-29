import React, { useEffect, useState } from 'react';
import { ViewState, Condominio, Segnalazione } from '../types';
import { db } from '../services/storage';
import { 
  BuildingOffice2Icon, 
  ExclamationTriangleIcon, 
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardProps {
  onViewChange: (view: ViewState) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onViewChange }) => {
  const [stats, setStats] = useState({
    buildings: 0,
    activeTickets: 0,
    resolvedTickets: 0,
  });
  const [recentTickets, setRecentTickets] = useState<Segnalazione[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [condomini, tickets] = await Promise.all([
          db.select<Condominio>('condomini'),
          db.select<Segnalazione>('segnalazioni')
        ]);
        
        setStats({
          buildings: condomini.length,
          activeTickets: tickets.filter(t => t.status !== 'resolved').length,
          resolvedTickets: tickets.filter(t => t.status === 'resolved').length,
        });

        setRecentTickets(tickets.slice(0, 5));
      } catch (err: any) {
        console.error("Dashboard load failed:", err);
        setError(err.message || 'Impossibile caricare i dati della dashboard.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const chartData = [
    { name: 'Attive', value: stats.activeTickets, color: '#ef4444' },
    { name: 'Risolte', value: stats.resolvedTickets, color: '#22c55e' },
  ];

  if (loading) {
    return (
      <div className="flex justify-center py-12">
         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg flex items-start gap-3">
        <ExclamationCircleIcon className="h-5 w-5 text-red-500 mt-0.5" />
        <div>
          <h3 className="text-sm font-medium text-red-800">Errore caricamento dashboard</h3>
          <p className="text-sm text-red-700 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-indigo-50 rounded-lg">
            <BuildingOffice2Icon className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Condomini Gestiti</p>
            <p className="text-2xl font-bold text-gray-900">{stats.buildings}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-red-50 rounded-lg">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Segnalazioni Attive</p>
            <p className="text-2xl font-bold text-gray-900">{stats.activeTickets}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-green-50 rounded-lg">
            <CheckCircleIcon className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Risolti questo Mese</p>
            <p className="text-2xl font-bold text-gray-900">{stats.resolvedTickets}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Segnalazioni Recenti</h3>
          <div className="space-y-4">
            {recentTickets.length === 0 ? (
               <p className="text-gray-500">Nessuna segnalazione trovata.</p>
            ) : (
              recentTickets.map(ticket => (
                <div key={ticket.id} className="flex items-start pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                  <span className={`h-2.5 w-2.5 mt-1.5 rounded-full flex-shrink-0 ${
                    ticket.status === 'resolved' ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{ticket.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{ticket.description}</p>
                    <span className="text-xs font-medium text-gray-400 mt-1 block">
                      Priorità: <span className="uppercase">
                        {ticket.priority === 'high' ? 'Alta' : ticket.priority === 'medium' ? 'Media' : 'Bassa'}
                      </span>
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
          <button 
            onClick={() => onViewChange('segnalazioni')}
            className="w-full mt-4 text-center text-sm text-indigo-600 font-medium hover:text-indigo-800"
          >
            Vedi tutte le segnalazioni &rarr;
          </button>
        </div>

        {/* Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
           <h3 className="text-lg font-bold text-gray-900 mb-4">Panoramica Stato Segnalazioni</h3>
           <div className="h-64 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" barSize={30} radius={[0, 4, 4, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>
    </div>
  );
};