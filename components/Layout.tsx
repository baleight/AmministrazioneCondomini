import React, { ReactNode } from 'react';
import { ViewState } from '../types';
import { 
  BuildingOffice2Icon, 
  UsersIcon, 
  WrenchScrewdriverIcon, 
  MegaphoneIcon, 
  HomeIcon,
  DocumentDuplicateIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

interface LayoutProps {
  children: ReactNode;
  currentView: ViewState;
  onViewChange: (view: ViewState) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, onViewChange }) => {
  const menuItems: { id: ViewState; label: string; icon: any }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: HomeIcon },
    { id: 'condomini', label: 'Buildings (Condomini)', icon: BuildingOffice2Icon },
    { id: 'immobili', label: 'Units (Immobili)', icon: DocumentDuplicateIcon },
    { id: 'anagrafiche', label: 'People (Anagrafiche)', icon: UsersIcon },
    { id: 'segnalazioni', label: 'Tickets (Segnalazioni)', icon: WrenchScrewdriverIcon },
    { id: 'comunicazioni', label: 'Communications', icon: MegaphoneIcon },
  ];

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl z-20">
        <div className="p-6 border-b border-slate-700 flex items-center space-x-3">
          <div className="h-8 w-8 bg-indigo-500 rounded-lg flex items-center justify-center">
            <BuildingOffice2Icon className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">KondoManager</h1>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-150 ${
                currentView === item.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <button className="flex items-center w-full px-3 py-2 text-sm font-medium text-slate-300 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
            <Cog6ToothIcon className="h-5 w-5 mr-3" />
            Settings
          </button>
          <div className="mt-4 pt-4 border-t border-slate-700 flex items-center px-3">
            <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold">
              AD
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">Admin User</p>
              <p className="text-xs text-slate-400">admin@kondo.it</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 h-16 flex items-center justify-between px-8 z-10">
          <h2 className="text-lg font-semibold text-gray-800 capitalize">
            {currentView.replace(/_/g, ' ')}
          </h2>
          <div className="flex items-center space-x-4">
             {/* Add global actions here if needed */}
             <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded border">
                Data Source: Local Storage (Mock)
             </span>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};
