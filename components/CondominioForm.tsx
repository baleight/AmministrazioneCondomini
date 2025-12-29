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
    if (!formData.nome.trim()) newErrors.nome = 'Building name is required';
    if (!formData.indirizzo.trim()) newErrors.indirizzo = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    if (!formData.codice_fiscale.trim()) newErrors.codice_fiscale = 'Tax ID is required';
    
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
      setErrors(prev => ({ ...prev, form: 'An error occurred while saving.' }));
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
        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
        <input 
          name="nome"
          type="text"
          value={formData.nome}
          onChange={handleChange}
          className={inputClass('nome')}
          placeholder="e.g. Residenza Parco Vittoria"
        />
        {errors.nome && <p className="text-red-500 text-xs mt-1">{errors.nome}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
        <input 
          name="indirizzo"
          type="text"
          value={formData.indirizzo}
          onChange={handleChange}
          className={inputClass('indirizzo')}
          placeholder="e.g. Via Roma 10"
        />
        {errors.indirizzo && <p className="text-red-500 text-xs mt-1">{errors.indirizzo}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
          <input 
            name="city"
            type="text"
            value={formData.city}
            onChange={handleChange}
            className={inputClass('city')}
            placeholder="e.g. Milano"
          />
          {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tax ID</label>
          <input 
            name="codice_fiscale"
            type="text"
            value={formData.codice_fiscale}
            onChange={handleChange}
            className={inputClass('codice_fiscale')}
            placeholder="Tax Code"
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
            placeholder="contact@condo.it"
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Total Units</label>
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
          Cancel
        </button>
        <button 
          type="submit"
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-70 flex items-center"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
             <>
               <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
               Saving...
             </>
          ) : (
            'Save Building'
          )}
        </button>
      </div>
    </form>
  );
};