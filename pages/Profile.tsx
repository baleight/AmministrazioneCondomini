import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { db } from '../services/storage';
import { Anagrafica } from '../types';
import { UserForm, UserFormData } from '../components/UserForm';

export const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const { notify } = useNotification();
  
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSave = async (data: UserFormData) => {
    if (!user) return;
    
    setStatus('saving');
    setErrorMsg('');

    try {
      if (user.role === 'admin') {
        // Mock update for admin (since admin is hardcoded in auth.ts)
        await new Promise(resolve => setTimeout(resolve, 1000));
        setStatus('success');
        notify('success', 'Profilo Aggiornato', 'Le modifiche al profilo Admin sono state salvate.');
      } else {
        // For normal users, we update the 'anagrafiche' table
        const people = await db.select<Anagrafica>('anagrafiche');
        const currentUserRecord = people.find(p => p.email === user.email); // Match by original email

        if (currentUserRecord) {
          const updates: Partial<Anagrafica> = {
            nome: data.name,
            email: data.email
          };
          
          // If password field is used, we update codice_fiscale (as per auth.ts logic)
          if (data.password.trim()) {
            updates.codice_fiscale = data.password.trim();
          }

          await db.update<Anagrafica>('anagrafiche', currentUserRecord.id, updates);
          
          // Important: Force logout if email/password changed as credentials are now different
          if (data.password || data.email !== user.email) {
            notify('warning', 'Credenziali Modificate', 'Hai modificato le credenziali. Effettua nuovamente l\'accesso.');
            logout();
          } else {
             setStatus('success');
             notify('success', 'Profilo Aggiornato', 'Le informazioni del profilo sono state aggiornate.');
             // Reset status after a delay to allow further edits without "success" message stuck
             setTimeout(() => setStatus('idle'), 3000);
          }
        } else {
          throw new Error('Record utente non trovato nel database.');
        }
      }
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMsg(err.message || 'Errore durante l\'aggiornamento.');
      notify('error', 'Errore Aggiornamento', err.message || 'Si è verificato un errore.');
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-indigo-600 p-8 flex items-center space-x-4">
          <div className="h-20 w-20 bg-white rounded-full flex items-center justify-center text-indigo-600 text-3xl font-bold border-4 border-indigo-200">
             {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="text-white">
            <h1 className="text-2xl font-bold">{user.name}</h1>
            <p className="text-indigo-200 capitalize">{user.role === 'admin' ? 'Amministratore di Sistema' : 'Residente / Proprietario'}</p>
          </div>
        </div>

        <div className="p-8">
          <UserForm 
            initialData={{ name: user.name, email: user.email }}
            role={user.role}
            onSubmit={handleSave}
            status={status}
            errorMessage={errorMsg}
          />
        </div>
      </div>
    </div>
  );
};