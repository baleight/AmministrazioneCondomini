import React, { useState, useRef } from 'react';
import { db } from '../services/storage';
import { useData } from '../context/DataContext';
import { useNotification } from '../context/NotificationContext';
import { usePermissions } from '../hooks/usePermissions';
import { Documento } from '../types';
import { 
  DocumentTextIcon, 
  ArrowDownTrayIcon, 
  TrashIcon, 
  PlusIcon,
  CloudArrowUpIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

const MAX_FILE_SIZE_BYTES = 500 * 1024; // 500 KB limit for Base64 in Sheets

export const DocumentiList: React.FC = () => {
  const { documenti, refreshData } = useData();
  const { notify } = useNotification();
  const { canUploadDocument, canDeleteDocument } = usePermissions();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [uploading, setUploading] = useState(false);

  // Form State
  const [newDocName, setNewDocName] = useState('');
  const [newDocType, setNewDocType] = useState<'contratto' | 'avviso' | 'verbale' | 'altro'>('contratto');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper: Convert File to Base64
  const toBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (file.type !== 'application/pdf') {
        notify('error', 'Formato Non Valido', 'Puoi caricare solo file PDF.');
        e.target.value = '';
        return;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        notify('error', 'File Troppo Grande', 'Il limite massimo è 500KB per documento.');
        e.target.value = '';
        return;
      }

      setSelectedFile(file);
      if (!newDocName) {
        // Auto-fill name without extension
        setNewDocName(file.name.replace('.pdf', ''));
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !newDocName) return;

    setUploading(true);
    try {
      const base64Data = await toBase64(selectedFile);
      
      const newDoc: Omit<Documento, 'id'> = {
        nome: newDocName,
        tipo: newDocType,
        data_caricamento: new Date().toISOString(),
        file_data: base64Data,
        file_name: selectedFile.name,
        dimensione: selectedFile.size
      };

      await db.insert<Documento>('documenti', newDoc);
      notify('success', 'Documento Caricato', 'Il file è stato archiviato correttamente.');
      
      setIsModalOpen(false);
      resetForm();
      await refreshData();
    } catch (err: any) {
      notify('error', 'Errore Caricamento', err.message || 'Impossibile salvare il file.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Sei sicuro di voler eliminare questo documento definitivamente?')) {
      try {
        await db.delete('documenti', id);
        notify('success', 'Eliminato', 'Documento rimosso.');
        await refreshData();
      } catch (err: any) {
        notify('error', 'Errore', 'Impossibile eliminare il documento.');
      }
    }
  };

  const resetForm = () => {
    setNewDocName('');
    setNewDocType('contratto');
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownload = (doc: Documento) => {
    const link = document.createElement('a');
    link.href = doc.file_data;
    link.download = doc.file_name || `${doc.nome}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter Logic
  const filteredDocs = documenti.filter(doc => {
    const matchesType = filterType === 'all' || doc.tipo === filterType;
    const matchesSearch = doc.nome.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Archivio Documenti</h1>
          <p className="text-sm text-gray-500 mt-1">Gestione contratti, verbali e avvisi condominiali</p>
        </div>
        
        {canUploadDocument && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <CloudArrowUpIcon className="h-5 w-5" />
            Carica Documento
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative rounded-md shadow-sm flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full rounded-md border-0 py-2.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            placeholder="Cerca documento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="w-full sm:w-48 relative">
           <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="block w-full rounded-md border-0 py-2.5 pl-10 pr-8 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 cursor-pointer bg-white"
          >
            <option value="all">Tutti i tipi</option>
            <option value="contratto">Contratti</option>
            <option value="avviso">Avvisi</option>
            <option value="verbale">Verbali</option>
            <option value="altro">Altro</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDocs.map(doc => (
          <div key={doc.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow relative group">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg ${
                  doc.tipo === 'contratto' ? 'bg-blue-50 text-blue-600' :
                  doc.tipo === 'avviso' ? 'bg-yellow-50 text-yellow-600' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  <DocumentTextIcon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 truncate max-w-[150px]" title={doc.nome}>
                    {doc.nome}
                  </h3>
                  <p className="text-xs text-gray-500 capitalize">{doc.tipo}</p>
                </div>
              </div>
              
              {canDeleteDocument && (
                <button 
                  onClick={() => handleDelete(doc.id)}
                  className="text-gray-300 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition-colors"
                  title="Elimina"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-3">
              <span>{new Date(doc.data_caricamento).toLocaleDateString()}</span>
              <span>{formatSize(doc.dimensione)}</span>
            </div>

            <div className="mt-4 flex gap-2">
               <button
                 onClick={() => handleDownload(doc)}
                 className="flex-1 flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 py-2 rounded-lg text-sm font-medium transition-colors"
               >
                 <ArrowDownTrayIcon className="h-4 w-4" />
                 Scarica
               </button>
               <a 
                 href={doc.file_data} 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="flex items-center justify-center px-3 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg border border-gray-200 transition-colors"
                 title="Anteprima"
               >
                 <EyeIcon className="h-4 w-4" />
               </a>
            </div>
          </div>
        ))}
      </div>

      {filteredDocs.length === 0 && (
         <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300 mt-4">
            <DocumentTextIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p>Nessun documento trovato.</p>
         </div>
      )}

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl animate-scale-in">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Carica Documento PDF</h2>
            
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Documento</label>
                <input 
                  type="text"
                  required
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="es. Contratto Affitto 2024"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipologia</label>
                <select
                  value={newDocType}
                  onChange={(e) => setNewDocType(e.target.value as any)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                >
                  <option value="contratto">Contratto</option>
                  <option value="avviso">Avviso</option>
                  <option value="verbale">Verbale</option>
                  <option value="altro">Altro</option>
                </select>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <CloudArrowUpIcon className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                {selectedFile ? (
                   <div>
                     <p className="text-sm font-medium text-indigo-600 truncate">{selectedFile.name}</p>
                     <p className="text-xs text-gray-500">{formatSize(selectedFile.size)}</p>
                   </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Clicca per selezionare un PDF</p>
                    <p className="text-xs text-gray-400 mt-1">Max 500KB</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 mt-4">
                <button 
                  type="button"
                  onClick={() => { setIsModalOpen(false); resetForm(); }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  disabled={uploading}
                >
                  Annulla
                </button>
                <button 
                  type="submit"
                  disabled={uploading || !selectedFile || !newDocName}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      Caricamento...
                    </>
                  ) : 'Salva'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};