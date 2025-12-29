import React, { useState, useEffect } from 'react';
import { Segnalazione, Condominio } from '../types';

interface SegnalazioneFormProps {
  initialData?: Segnalazione | null;
  condomini: Condominio[];
  onSubmit: (data: Omit<Segnalazione, 'id' | 'created_at' | 'ai_analysis'>) => Promise<void>;
  onCancel: () => void;
}

export const SegnalazioneForm: React.FC<SegnalazioneFormProps> = ({ initialData, condomini, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    condominio_id: condomini.length > 0 ? condomini[0].id : 0,
    title: '',
    description: '',
    priority: 'low' as 'low' | 'medium' | 'high',
    status: 'open' as 'open' | 'in_progress' | 'resolved'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        condominio_id: initialData.condominio_id,
        title: initialData.title,
        description: initialData.description,
        priority: initialData.priority,
        status: initialData.status
      });
    } else {
      setFormData({
        condominio_id: condomini.length > 0 ? condomini[0].id : 0,
        title: '',
        description: '',
        priority: 'low',
        status: 'open'
      });
    }
  }, [initialData, condomini]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: name === 'condominio_id' ? parseInt(value) : value
    }));

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
    if (!formData.condominio_id) newErrors.condominio_id = 'Seleziona un condominio';
    if (!formData.title.trim()) newErrors.title = 'Il titolo è obbligatorio';
    if (!formData.description.trim()) newErrors.description = 'La descrizione è obbligatoria';
    
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
          <option value={0} disabled>Seleziona condominio...</option>
          {condomini.map(c => (
            <option key={c.id} value={c.id}>{c.nome}</option>
          ))}
        </select>
        {errors.condominio_id && <p className="text-red-500 text-xs mt-1">{errors.condominio_id}</p>}
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Titolo Problema</label>
        <input 
          name="title"
          type="text"
          value={formData.title}
          onChange={handleChange}
          className={inputClass('title')}
          placeholder="es. Perdita d'acqua ingresso"
        />
        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione Dettagliata</label>
        <textarea 
          name="description"
          rows={4}
          value={formData.description}
          onChange={handleChange}
          className={inputClass('description')}
          placeholder="Descrivi il problema in dettaglio..."
        />
        {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Priorità</label>
          <select
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className={inputClass('priority')}
          >
            <option value="low">Bassa</option>
            <option value="medium">Media</option>
            <option value="high">Alta</option>
          </select>
        </div>
        
        {/* Mostra lo stato solo se stiamo modificando (initialData esiste) */}
        {initialData && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stato</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className={inputClass('status')}
            >
              <option value="open">Aperto</option>
              <option value="in_progress">In Corso</option>
              <option value="resolved">Risolto</option>
            </select>
          </div>
        )}
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
          {isSubmitting ? 'Salvataggio...' : 'Salva Segnalazione'}
        </button>
      </div>
    </form>
  );
};