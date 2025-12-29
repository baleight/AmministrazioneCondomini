import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/storage';
import { Anagrafica } from '../types';
import { UserCircleIcon, KeyIcon, EnvelopeIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '' // For residents, this maps to codice_fiscale
  });
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        password: ''
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('saving');
    setErrorMsg('');

    try {
      if (user?.role === 'admin') {
        // Mock update for admin (since admin is hardcoded in auth.ts)
        await new Promise(resolve => setTimeout(resolve, 1000));
        setStatus('success');
      } else {
        // For normal users, we update the 'anagrafiche' table
        const people = await db.select<Anagrafica>('anagrafiche');
        const currentUserRecord = people.find(p => p.email === user?.email); // Match by original email

        if (currentUserRecord) {
          const updates: Partial<Anagrafica> = {
            nome: formData.name,
            email: formData.email
          };
          
          // If password field is used, we update codice_fiscale (as per auth.ts logic)
          if (formData.password.trim()) {
            updates.codice_fiscale = formData.password.trim();
          }

          await db.update<Anagrafica>('anagrafiche', currentUserRecord.id, updates);
          
          // Important: Force logout if email/password changed as credentials are now different
          if (formData.password || formData.email !== user?.email) {
            alert('Hai modificato le credenziali. Effettua nuovamente l\'accesso.');
            logout();
          } else {
             setStatus('success');
          }
        } else {
          throw new Error('Record utente non trovato nel database.');
        }
      }
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMsg(err.message || 'Errore durante l\'aggiornamento.');
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
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <UserCircleIcon className="h-4 w-4 mr-2 text-gray-400" />
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({...prev, name: e.target.value}))}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
                  Indirizzo Email (Username)
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData(prev => ({...prev, email: e.target.value}))}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Nota: Se modifichi l'email, dovrai effettuare nuovamente l'accesso.
                </p>
              </div>

              <div className="pt-4 border-t border-gray-100">
                 <h3 className="text-md font-semibold text-gray-900 mb-4">Sicurezza</h3>
                 
                 <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <KeyIcon className="h-4 w-4 mr-2 text-gray-400" />
                    {user.role === 'admin' ? 'Nuova Password' : 'Nuovo Codice Fiscale (Password)'}
                  </label>
                  <input
                    type="password"
                    placeholder="Lascia vuoto per mantenere quella attuale"
                    value={formData.password}
                    onChange={e => setFormData(prev => ({...prev, password: e.target.value}))}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                  {user.role !== 'admin' && (
                    <p className="text-xs text-gray-500 mt-1">
                      Per i residenti, il Codice Fiscale viene utilizzato come password di accesso.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-6">
               <div className="flex items-center">
                 {status === 'success' && (
                   <span className="text-green-600 flex items-center text-sm font-medium animate-pulse">
                     <CheckCircleIcon className="h-5 w-5 mr-1" />
                     Profilo aggiornato con successo!
                   </span>
                 )}
                 {status === 'error' && (
                   <span className="text-red-600 text-sm font-medium">
                     {errorMsg}
                   </span>
                 )}
               </div>

               <button
                 type="submit"
                 disabled={status === 'saving'}
                 className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 font-medium shadow-sm transition-all disabled:opacity-70 flex items-center"
               >
                 {status === 'saving' ? (
                   <>
                     <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                     Salvataggio...
                   </>
                 ) : 'Salva Modifiche'}
               </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};