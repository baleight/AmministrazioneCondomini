import { Condominio, Anagrafica, Segnalazione, Comunicazione, Immobile } from '../types';

// Initial Seed Data
const INITIAL_CONDOMINI: Condominio[] = [
  { id: 1, nome: 'Residenza Parco Vittoria', indirizzo: 'Via Roma 10', city: 'Milano', email: 'parcovittoria@kondo.it', codice_fiscale: '80012345678', units_count: 24 },
  { id: 2, nome: 'Torre del Sole', indirizzo: 'Corso Italia 45', city: 'Torino', email: 'torresole@kondo.it', codice_fiscale: '90087654321', units_count: 56 },
];

const INITIAL_ANAGRAFICHE: Anagrafica[] = [
  { id: 1, nome: 'Mario Rossi', email: 'mario.rossi@email.com', telefono: '+39 333 1234567', codice_fiscale: 'RSSMRA80A01H501U', role: 'owner' },
  { id: 2, nome: 'Giulia Bianchi', email: 'giulia.b@email.com', telefono: '+39 333 9876543', codice_fiscale: 'BNCGLI85B45H501Z', role: 'tenant' },
];

const INITIAL_SEGNALAZIONI: Segnalazione[] = [
  { id: 1, condominio_id: 1, title: 'Ascensore bloccato', description: 'L\'ascensore della scala B è fermo al secondo piano.', status: 'open', priority: 'high', created_at: new Date().toISOString() },
  { id: 2, condominio_id: 1, title: 'Lampadina ingresso bruciata', description: 'Richiesta sostituzione faretto led ingresso principale.', status: 'resolved', priority: 'low', created_at: new Date(Date.now() - 86400000).toISOString() },
];

const INITIAL_IMMOBILI: Immobile[] = [
  { id: 1, condominio_id: 1, nome: 'Appartamento 1A', piano: '1', superficie: 85, owner_id: 1 },
  { id: 2, condominio_id: 1, nome: 'Appartamento 1B', piano: '1', superficie: 90, tenant_id: 2 },
];

// Helper to simulate async DB calls
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class MockSheetDB {
  private get<T>(key: string, initial: T): T {
    const stored = localStorage.getItem(`kondo_${key}`);
    if (!stored) {
      localStorage.setItem(`kondo_${key}`, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(stored);
  }

  private set<T>(key: string, data: T): void {
    localStorage.setItem(`kondo_${key}`, JSON.stringify(data));
  }

  // Generic methods
  async select<T>(table: string): Promise<T[]> {
    await delay(300); // Simulate network latency
    if (table === 'condomini') return this.get<T[]>(table, INITIAL_CONDOMINI as unknown as T[]);
    if (table === 'anagrafiche') return this.get<T[]>(table, INITIAL_ANAGRAFICHE as unknown as T[]);
    if (table === 'segnalazioni') return this.get<T[]>(table, INITIAL_SEGNALAZIONI as unknown as T[]);
    if (table === 'immobili') return this.get<T[]>(table, INITIAL_IMMOBILI as unknown as T[]);
    if (table === 'comunicazioni') return this.get<T[]>(table, [] as unknown as T[]);
    return [];
  }

  async insert<T extends { id: number }>(table: string, item: Omit<T, 'id'>): Promise<T> {
    await delay(300);
    const items = await this.select<T>(table);
    const newId = (items.length > 0 ? Math.max(...items.map(i => i.id)) : 0) + 1;
    const newItem = { ...item, id: newId } as T;
    this.set(table, [...items, newItem]);
    return newItem;
  }

  async update<T extends { id: number }>(table: string, id: number, updates: Partial<T>): Promise<T> {
    await delay(200);
    const items = await this.select<T>(table);
    const index = items.findIndex(i => i.id === id);
    if (index === -1) throw new Error('Item not found');
    
    const updatedItem = { ...items[index], ...updates };
    items[index] = updatedItem;
    this.set(table, items);
    return updatedItem;
  }

  async delete(table: string, id: number): Promise<void> {
    await delay(200);
    const items = await this.select<{ id: number }>(table);
    this.set(table, items.filter(i => i.id !== id));
  }
}

export const db = new MockSheetDB();
