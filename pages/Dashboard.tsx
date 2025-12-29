import React, { useEffect, useState } from 'react';
import { ViewState, Condominio, Segnalazione } from '../types';
import { db } from '../services/storage';
import { 
  BuildingOffice2Icon, 
  ExclamationTriangleIcon, 
  CheckCircleIcon 
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

  useEffect(() => {
    const loadData = async () => {
      const condomini = await db.select('condomini');
      const tickets = await db.select('segnalazioni') as Segnalazione[];
      
      setStats({
        buildings: condomini.length,
        activeTickets: tickets.filter(t => t.status !== 'resolved').length,
        resolvedTickets: tickets.filter(t => t.status === 'resolved').length,
      });

      setRecentTickets(tickets.slice(0, 5));
    };
    loadData();
  }, []);

  const chartData = [
    { name: 'Active', value: stats.activeTickets, color: '#ef4444' },
    { name: 'Resolved', value: stats.resolvedTickets, color: '#22c55e' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-indigo-50 rounded-lg">
            <BuildingOffice2Icon className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Managed Buildings</p>
            <p className="text-2xl font-bold text-gray-900">{stats.buildings}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-red-50 rounded-lg">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Active Tickets</p>
            <p className="text-2xl font-bold text-gray-900">{stats.activeTickets}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-green-50 rounded-lg">
            <CheckCircleIcon className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Resolved this Month</p>
            <p className="text-2xl font-bold text-gray-900">{stats.resolvedTickets}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Maintenance Tickets</h3>
          <div className="space-y-4">
            {recentTickets.length === 0 ? (
               <p className="text-gray-500">No tickets found.</p>
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
                      Priority: <span className="uppercase">{ticket.priority}</span>
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
            View All Tickets &rarr;
          </button>
        </div>

        {/* Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
           <h3 className="text-lg font-bold text-gray-900 mb-4">Ticket Status Overview</h3>
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