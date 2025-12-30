// Enum for specific types
export enum DocType {
  PASSPORT = 'passport',
  ID_CARD = 'id_card',
}

// Core Entity Interfaces matching the requested schema
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'user';
  // Campi sensibili per autenticazione e sicurezza
  password_hash?: string;
  two_factor_secret?: string;
  remember_token?: string;
}

export interface Condominio {
  id: number;
  nome: string;
  indirizzo: string;
  email: string;
  codice_fiscale: string;
  city: string; // Simplified for UI
  units_count: number;
}

export interface Anagrafica {
  id: number;
  nome: string;
  email: string;
  telefono: string;
  codice_fiscale: string;
  role: 'owner' | 'tenant';
}

export interface Immobile {
  id: number;
  condominio_id: number;
  nome: string; // e.g. "Unit 1A"
  piano: string;
  superficie: number;
  owner_id?: number;
  tenant_id?: number;
}

export interface Segnalazione {
  id: number;
  condominio_id: number;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  ai_analysis?: string; // Field for Gemini analysis
}

export interface Comunicazione {
  id: number;
  condominio_id: number;
  title: string;
  content: string;
  sent_at: string;
}

export interface Documento {
  id: number;
  nome: string;
  tipo: 'contratto' | 'avviso' | 'verbale' | 'altro';
  data_caricamento: string;
  file_data: string; // Base64 string per archiviazione su Sheet
  file_name: string; // Nome originale del file
  dimensione: number; // in bytes
}

export interface Evento {
  id: number;
  title: string;
  description: string;
  start_date: string; // ISO String
  end_date?: string;  // ISO String
  type: 'assemblea' | 'manutenzione' | 'scadenza' | 'altro';
  condominio_id?: number; // Opzionale, se null è un evento generale
}

// Navigation Types
export type ViewState = 'dashboard' | 'condomini' | 'anagrafiche' | 'immobili' | 'segnalazioni' | 'comunicazioni' | 'documenti' | 'agenda' | 'profile';