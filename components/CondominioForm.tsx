import React, { useState, useEffect } from 'react';
import { Condominio } from '../types';

interface CondominioFormProps {
  initialData?: Condominio | null;
  onSubmit: (data: Omit<Condominio, 'id'>) => Promise<void>;
  onCancel: () => void;
}

export const CondominioForm: React.FC<CondominioFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<Omit<Condominio, 'id'>>({
    nome: '',
    indirizzo: '',
    city: '',
    email: '',
    codice_fiscale: '',
    units_count: 0
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      const { id, ...rest } = initialData;
      setFormData(rest);
    } else {
      setFormData({
        nome: '',
        indirizzo: '',
        city: '',
        email: '',
        codice_fiscale: '',
        units_count: 0
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'units_count' ? parseInt(value) || 0 : value
    }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.nome.trim()) newErrors.nome = 'Il nome è obbligatorio';
    if (!formData.indirizzo.trim()) newErrors.indirizzo = "L'indirizzo è obbligatorio";
    if (!formData.city.trim()) newErrors.city = 'La città è obbligatoria';
    
    if (!formData.email.trim()) {
      newErrors.email = "L'email è obbligatoria";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Indirizzo email non valido';
    }

    if (!formData.codice_fiscale.trim()) newErrors.codice_fiscale = 'Il Codice Fiscale è obbligatorio';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (err) {
      console.error(err);
      setErrors(prev => ({ ...prev, form: 'Si è verificato un errore durante il salvataggio.' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = (name: string) => `w-full border rounded-md p-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-colors ${errors[name] ? 'border-red-300 focus:ring-red-200' : 'border-gray-300'}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.form && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
          {errors.form}
        </div>
      )}
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nome Condominio</label>
        <input 
          name="nome"
          type="text"
          value={formData.nome}
          onChange={handleChange}
          className={inputClass('nome')}
          placeholder="es. Residenza Parco Vittoria"
        />
        {errors.nome && <p className="text-red-500 text-xs mt-1">{errors.nome}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Indirizzo</label>
        <input 
          name="indirizzo"
          type="text"
          value={formData.indirizzo}
          onChange={handleChange}
          className={inputClass('indirizzo')}
          placeholder="es. Via Roma 10"
        />
        {errors.indirizzo && <p className="text-red-500 text-xs mt-1">{errors.indirizzo}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Città</label>
          <input 
            name="city"
            type="text"
            value={formData.city}
            onChange={handleChange}
            className={inputClass('city')}
            placeholder="es. Milano"
          />
          {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Codice Fiscale</label>
          <input 
            name="codice_fiscale"
            type="text"
            value={formData.codice_fiscale}
            onChange={handleChange}
            className={inputClass('codice_fiscale')}
            placeholder="Codice Fiscale"
          />
           {errors.codice_fiscale && <p className="text-red-500 text-xs mt-1">{errors.codice_fiscale}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input 
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            className={inputClass('email')}
            placeholder="contatto@condo.it"
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Totale Unità</label>
          <input 
            name="units_count"
            type="number"
            min="0"
            value={formData.units_count}
            onChange={handleChange}
            className={inputClass('units_count')}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 mt-6">
        <button 
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          disabled={isSubmitting}
        >
          Annulla
        </button>
        <button 
          type="submit"
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-70 flex items-center"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
             <>
               <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
               Salvataggio...
             </>
          ) : (
            'Salva'
          )}
        </button>
      </div>
    </form>
  );
};