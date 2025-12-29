import React, { ReactNode, useState } from 'react';
import { ViewState } from '../types';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { isMock } from '../services/storage';
import { 
  BuildingOffice2Icon, 
  UsersIcon, 
  WrenchScrewdriverIcon, 
  MegaphoneIcon, 
  HomeIcon,
  DocumentDuplicateIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  CloudIcon,
  ServerIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface LayoutProps {
  children: ReactNode;
  currentView: ViewState;
  onViewChange: (view: ViewState) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, onViewChange }) => {
  const { user, logout } = useAuth();
  const { canAccessView, role } = usePermissions();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Define menus with role access checks handled by usePermissions
  const allMenuItems: { id: ViewState; label: string; icon: any }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: HomeIcon },
    { id: 'condomini', label: 'Condomini', icon: BuildingOffice2Icon },
    { id: 'immobili', label: 'Unità Immobiliari', icon: DocumentDuplicateIcon },
    { id: 'anagrafiche', label: 'Anagrafiche', icon: UsersIcon },
    { id: 'segnalazioni', label: 'Segnalazioni', icon: WrenchScrewdriverIcon },
    { id: 'comunicazioni', label: 'Comunicazioni', icon: MegaphoneIcon },
  ];

  // Filter items based on permissions
  const visibleMenuItems = allMenuItems.filter(item => canAccessView(item.id));

  // Helper to translate view titles in header
  const getTitle = (view: ViewState) => {
    switch (view) {
      case 'dashboard': return 'Dashboard';
      case 'condomini': return 'Gestione Condomini';
      case 'immobili': return 'Gestione Unità Immobiliari';
      case 'anagrafiche': return 'Gestione Anagrafiche';
      case 'segnalazioni': return 'Segnalazioni Manutenzione';
      case 'comunicazioni': return 'Comunicazioni';
      case 'profile': return 'Il Mio Profilo';
      default: return 'KondoManager';
    }
  };

  const handleViewChange = (view: ViewState) => {
    onViewChange(view);
    setIsMobileMenuOpen(false); // Close mobile menu on navigation
  };

  const getRoleBadgeColor = () => {
    switch(role) {
      case 'admin': return 'bg-indigo-500';
      case 'manager': return 'bg-purple-500';
      default: return 'bg-green-600';
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 z-20 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white flex flex-col shadow-xl transition-transform duration-300 ease-in-out
          md:relative md:translate-x-0
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 bg-indigo-500 rounded-lg flex items-center justify-center">
              <BuildingOffice2Icon className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Kondo</h1>
          </div>
          {/* Mobile Close Button inside Sidebar */}
          <button 
            onClick={() => setIsMobileMenuOpen(false)} 
            className="md:hidden text-slate-400 hover:text-white"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {visibleMenuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleViewChange(item.id)}
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
          <button 
            onClick={() => handleViewChange('profile')}
            className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors mb-2 ${
                currentView === 'profile' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <UserCircleIcon className="h-5 w-5 mr-3" />
            Il Mio Profilo
          </button>
          <button 
            onClick={logout}
            className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-300 rounded-lg hover:bg-slate-800 hover:text-red-200 transition-colors mb-2"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3" />
            Disconnetti
          </button>
          <div className="mt-2 pt-4 border-t border-slate-700 flex items-center px-3">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${getRoleBadgeColor()}`}>
              {user?.name.charAt(0).toUpperCase()}{user?.name.charAt(1).toUpperCase()}
            </div>
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-medium text-white truncate" title={user?.name}>{user?.name}</p>
              <p className="text-xs text-slate-400 capitalize">{role}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 h-16 flex items-center justify-between px-4 md:px-8 z-10 shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile Toggle Button */}
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden -ml-2 p-2 text-gray-500 hover:bg-gray-100 rounded-md"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
            <h2 className="text-lg font-semibold text-gray-800 capitalize truncate">
              {getTitle(currentView)}
            </h2>
          </div>
          
          <div className="flex items-center space-x-4">
             {isMock ? (
               <span className="flex items-center gap-1.5 text-xs px-2 py-1 md:px-3 md:py-1.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200 font-medium" title="I dati sono salvati solo nel browser.">
                  <ServerIcon className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">Salvataggio Locale</span>
                  <span className="md:hidden">Mock</span>
               </span>
             ) : (
               <span className="flex items-center gap-1.5 text-xs px-2 py-1 md:px-3 md:py-1.5 rounded-full bg-green-50 text-green-700 border border-green-200 font-medium animate-pulse-once">
                  <CloudIcon className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">Online</span>
               </span>
             )}
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-auto p-4 md:p-8 w-full">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};