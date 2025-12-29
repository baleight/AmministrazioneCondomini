import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  InformationCircleIcon, 
  ExclamationTriangleIcon, 
  XMarkIcon 
} from '@heroicons/react/24/outline';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
}

interface NotificationContextType {
  notify: (type: NotificationType, title: string, message: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const notify = useCallback((type: NotificationType, title: string, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications(prev => [...prev, { id, type, title, message }]);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  }, []);

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 w-full max-w-sm pointer-events-none">
        {notifications.map((notification) => (
          <div 
            key={notification.id}
            className={`
              pointer-events-auto transform transition-all duration-300 ease-in-out animate-slide-in
              flex items-start p-4 rounded-lg shadow-lg border-l-4 bg-white
              ${notification.type === 'success' ? 'border-green-500' : ''}
              ${notification.type === 'error' ? 'border-red-500' : ''}
              ${notification.type === 'warning' ? 'border-yellow-500' : ''}
              ${notification.type === 'info' ? 'border-blue-500' : ''}
            `}
          >
            <div className="flex-shrink-0">
              {notification.type === 'success' && <CheckCircleIcon className="h-6 w-6 text-green-500" />}
              {notification.type === 'error' && <ExclamationCircleIcon className="h-6 w-6 text-red-500" />}
              {notification.type === 'warning' && <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />}
              {notification.type === 'info' && <InformationCircleIcon className="h-6 w-6 text-blue-500" />}
            </div>
            <div className="ml-3 w-0 flex-1 pt-0.5">
              <p className="text-sm font-medium text-gray-900">{notification.title}</p>
              <p className="mt-1 text-sm text-gray-500">{notification.message}</p>
            </div>
            <div className="ml-4 flex flex-shrink-0">
              <button
                type="button"
                className="inline-flex rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                onClick={() => removeNotification(notification.id)}
              >
                <span className="sr-only">Close</span>
                <XMarkIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};