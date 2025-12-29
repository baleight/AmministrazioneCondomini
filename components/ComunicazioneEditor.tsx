import React, { useState, useRef, useEffect } from 'react';
import { 
  BoldIcon, 
  ItalicIcon, 
  ListBulletIcon, 
  XMarkIcon, 
  PaperAirplaneIcon,
  EnvelopeIcon 
} from '@heroicons/react/24/outline';

interface ComunicazioneEditorProps {
  initialData?: { title: string; content: string } | null;
  onSave: (data: { title: string; content: string }) => void;
  onSendEmail: (data: { title: string; content: string }) => void;
  onCancel: () => void;
}

export const ComunicazioneEditor: React.FC<ComunicazioneEditorProps> = ({ initialData, onSave, onSendEmail, onCancel }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setContent(initialData.content);
    } else {
      setTitle('');
      setContent('');
    }
  }, [initialData]);

  const insertFormat = (startTag: string, endTag: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const selection = text.substring(start, end);
    const after = text.substring(end);

    const newText = `${before}${startTag}${selection}${endTag}${after}`;
    setContent(newText);
    
    // Ripristina il focus e la selezione
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + startTag.length, end + startTag.length);
    }, 0);
  };

  const handleAction = (action: 'save' | 'email') => {
    if (!title.trim() || !content.trim()) return;
    
    const data = { title, content };
    if (action === 'save') {
      onSave(data);
    } else {
      onSendEmail(data);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden flex flex-col h-full animate-fadeIn">
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
        <h3 className="font-semibold text-gray-900">Editor Comunicazione</h3>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
      
      <div className="p-6 flex-1 flex flex-col gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Oggetto</label>
          <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-lg font-bold text-gray-900 border-b-2 border-transparent focus:border-indigo-500 outline-none placeholder-gray-300 transition-all pb-1"
            placeholder="Titolo della comunicazione..."
          />
        </div>

        <div className="flex-1 flex flex-col relative group">
           <div className="flex items-center gap-1 mb-2 border-b border-gray-100 pb-2 transition-opacity duration-200">
              <button onClick={() => insertFormat('**', '**')} className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700" title="Grassetto">
                <BoldIcon className="h-4 w-4" />
              </button>
              <button onClick={() => insertFormat('*', '*')} className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700" title="Corsivo">
                <ItalicIcon className="h-4 w-4" />
              </button>
              <button onClick={() => insertFormat('\n- ', '')} className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700" title="Elenco Puntato">
                <ListBulletIcon className="h-4 w-4" />
              </button>
           </div>
           <textarea 
             ref={textareaRef}
             value={content}
             onChange={(e) => setContent(e.target.value)}
             className="w-full flex-1 resize-none outline-none text-gray-700 leading-relaxed min-h-[300px]"
             placeholder="Scrivi qui il contenuto della comunicazione..."
           />
        </div>
      </div>

      <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex gap-3">
        <button 
          onClick={() => handleAction('save')}
          disabled={!title.trim() || !content.trim()}
          className="flex-1 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          <PaperAirplaneIcon className="h-5 w-5" />
          Pubblica in Bacheca
        </button>

        <button 
          onClick={() => handleAction('email')}
          disabled={!title.trim() || !content.trim()}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          <EnvelopeIcon className="h-5 w-5" />
          Invia Email
        </button>
      </div>
    </div>
  );
};