import React, { useState, useEffect } from 'react';
import { UserCircleIcon, KeyIcon, EnvelopeIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

export interface UserFormData {
  name: string;
  email: string;
  password: string;
}

interface UserFormProps {
  initialData: { name: string; email: string };
  role: 'admin' | 'manager' | 'user';
  onSubmit: (data: UserFormData) => Promise<void>;
  status: 'idle' | 'saving' | 'success' | 'error';
  errorMessage?: string;
}

export const UserForm: React.FC<UserFormProps> = ({ initialData, role, onSubmit, status, errorMessage }) => {
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setFormData({
      name: initialData.name,
      email: initialData.email,
      password: ''
    });
  }, [initialData]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Il nome è obbligatorio';
    }

    if (!formData.email.trim()) {
      newErrors.email = "L'email è obbligatoria";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Inserisci un indirizzo email valido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Pulisci l'errore quando l'utente scrive
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        {/* Name Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
            <UserCircleIcon className="h-4 w-4 mr-2 text-gray-400" />
            Nome Completo
          </label>
          <input
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${
              errors.name ? 'border-red-300 ring-1 ring-red-100' : 'border-gray-300'
            }`}
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>

        {/* Email Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
            <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
            Indirizzo Email (Username)
          </label>
          <input
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${
              errors.email ? 'border-red-300 ring-1 ring-red-100' : 'border-gray-300'
            }`}
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          <p className="text-xs text-gray-500 mt-1">
            Nota: Se modifichi l'email, dovrai effettuare nuovamente l'accesso.
          </p>
        </div>

        {/* Security Section */}
        <div className="pt-4 border-t border-gray-100">
          <h3 className="text-md font-semibold text-gray-900 mb-4">Sicurezza</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <KeyIcon className="h-4 w-4 mr-2 text-gray-400" />
              {role === 'admin' ? 'Nuova Password' : 'Nuovo Codice Fiscale (Password)'}
            </label>
            <input
              name="password"
              type="password"
              placeholder="Lascia vuoto per mantenere quella attuale"
              value={formData.password}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
            {role !== 'admin' && (
              <p className="text-xs text-gray-500 mt-1">
                Per i residenti, il Codice Fiscale viene utilizzato come password di accesso.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Footer Actions & Status */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-100">
        <div className="flex items-center flex-1 mr-4">
          {status === 'success' && (
            <span className="text-green-600 flex items-center text-sm font-medium animate-pulse">
              <CheckCircleIcon className="h-5 w-5 mr-1" />
              Profilo aggiornato con successo!
            </span>
          )}
          {status === 'error' && (
            <span className="text-red-600 flex items-center text-sm font-medium">
              <ExclamationCircleIcon className="h-5 w-5 mr-1" />
              {errorMessage || 'Errore durante il salvataggio.'}
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={status === 'saving'}
          className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 font-medium shadow-sm transition-all disabled:opacity-70 flex items-center whitespace-nowrap"
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
  );
};