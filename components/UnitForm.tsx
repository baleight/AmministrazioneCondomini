import React, { useState, useEffect } from 'react';
import { Immobile, Condominio, Anagrafica } from '../types';

interface UnitFormProps {
  initialData?: Immobile | null;
  condomini: Condominio[];
  people: Anagrafica[];
  onSubmit: (data: Omit<Immobile, 'id'>) => Promise<void>;
  onCancel: () => void;
}

export const UnitForm: React.FC<UnitFormProps> = ({ initialData, condomini, people, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<Omit<Immobile, 'id'>>({
    condominio_id: condomini.length > 0 ? condomini[0].id : 0,
    nome: '',
    piano: '',
    superficie: 0,
    owner_id: undefined,
    tenant_id: undefined
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      const { id, ...rest } = initialData;
      setFormData(rest);
    } else {
      setFormData({
        condominio_id: condomini.length > 0 ? condomini[0].id : 0,
        nome: '',
        piano: '',
        superficie: 0,
        owner_id: undefined,
        tenant_id: undefined
      });
    }
  }, [initialData, condomini]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    let parsedValue: string | number | undefined = value;
    
    if (name === 'condominio_id' || name === 'superficie') {
      parsedValue = parseInt(value) || 0;
    } else if (name === 'owner_id' || name === 'tenant_id') {
      parsedValue = value === '' ? undefined : parseInt(value);
    }

    setFormData(prev => ({
      ...prev,
      [name]: parsedValue
    }));

    // Clear error
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
    if (!formData.condominio_id) newErrors.condominio_id = 'Il condominio è obbligatorio';
    if (!formData.nome.trim()) newErrors.nome = "Il nome dell'unità è obbligatorio";
    if (!formData.piano.trim()) newErrors.piano = 'Il piano è obbligatorio';
    if (formData.superficie <= 0) newErrors.superficie = 'La superficie deve essere maggiore di 0';
    
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
        <label className="block text-sm font-medium text-gray-700 mb-1">Condominio</label>
        <select
          name="condominio_id"
          value={formData.condominio_id}
          onChange={handleChange}
          className={inputClass('condominio_id')}
        >
          <option value={0} disabled>Seleziona un condominio</option>
          {condomini.map(c => (
            <option key={c.id} value={c.id}>{c.nome}</option>
          ))}
        </select>
        {errors.condominio_id && <p className="text-red-500 text-xs mt-1">{errors.condominio_id}</p>}
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome Unità</label>
          <input 
            name="nome"
            type="text"
            value={formData.nome}
            onChange={handleChange}
            className={inputClass('nome')}
            placeholder="es. Interno 1A"
          />
          {errors.nome && <p className="text-red-500 text-xs mt-1">{errors.nome}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Piano</label>
          <input 
            name="piano"
            type="text"
            value={formData.piano}
            onChange={handleChange}
            className={inputClass('piano')}
            placeholder="es. 1"
          />
          {errors.piano && <p className="text-red-500 text-xs mt-1">{errors.piano}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Superficie (mq)</label>
        <input 
          name="superficie"
          type="number"
          min="1"
          value={formData.superficie}
          onChange={handleChange}
          className={inputClass('superficie')}
        />
        {errors.superficie && <p className="text-red-500 text-xs mt-1">{errors.superficie}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Proprietario</label>
          <select
            name="owner_id"
            value={formData.owner_id || ''}
            onChange={handleChange}
            className={inputClass('owner_id')}
          >
            <option value="">Nessun proprietario</option>
            {people.filter(p => p.role === 'owner').map(p => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Inquilino</label>
          <select
            name="tenant_id"
            value={formData.tenant_id || ''}
            onChange={handleChange}
            className={inputClass('tenant_id')}
          >
            <option value="">Nessun inquilino</option>
            {people.filter(p => p.role === 'tenant').map(p => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>
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
          {isSubmitting ? 'Salvataggio...' : 'Salva Unità'}
        </button>
      </div>
    </form>
  );
};