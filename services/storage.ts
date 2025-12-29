import CryptoJS from 'crypto-js';

// ==========================================
// CONFIGURATION
// ==========================================
// 1. Pubblica il tuo script come Web App (Chiunque può accedere)
// 2. Copia l'URL che inizia con "https://script.google.com/..."
// 3. INCOLLALO QUI SOTTO TRA LE VIRGOLETTE:
const GOOGLE_SCRIPT_URL: string = "https://script.google.com/macros/s/AKfycbyLZaIhzJQTzJG7gLRCzPw-KlNv8kaDWJqCkrfDTCN9TCeb3rzaDkfqgDAvZyIqYC1e/exec"; 

const ENCRYPTION_KEY = "kondo-manager-secure-key-2025"; 

// Campi che devono essere sempre crittografati nel database
// Questi corrispondono ai campi richiesti per la sicurezza utente
const SENSITIVE_FIELDS = [
  'password_hash', 
  'two_factor_secret', 
  'remember_token',
  'password', // Mantenuto per compatibilità
  'codice_fiscale' // Opzionale: spesso sensibile, lo aggiungiamo per sicurezza
];

// ==========================================
// ENCRYPTION HELPERS
// ==========================================

const encryptValue = (value: any): string => {
  if (value === undefined || value === null) return "";
  try {
    // Stringify assicura che tipi complessi (o numeri) vengano trattati come stringhe prima della cifratura
    return CryptoJS.AES.encrypt(JSON.stringify(value), ENCRYPTION_KEY).toString();
  } catch (e) {
    console.error("Encryption failed", e);
    // In caso di errore critico, restituisci stringa vuota per non salvare dati in chiaro
    return "";
  }
};

const decryptValue = (ciphertext: string): any => {
  if (!ciphertext || typeof ciphertext !== 'string') return ciphertext;
  
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    
    // Se la stringa è vuota, la chiave potrebbe essere errata o il testo non cifrato
    if (!originalText) return ciphertext; 

    try {
      // Tentiamo di parsare il JSON (poiché encryptValue usa stringify)
      return JSON.parse(originalText);
    } catch (jsonError) {
      // Se fallisce il parse JSON ma la decrittazione ha prodotto testo,
      // restituiamo il testo decrittato (potrebbe essere stato salvato senza stringify in precedenza)
      return originalText;
    }
  } catch (e) {
    // Se la decrittazione fallisce (es. formato non valido), restituiamo il valore originale
    // Questo gestisce il caso di dati vecchi non criptati nel DB
    return ciphertext;
  }
};

const encryptRow = (row: any) => {
  const encrypted: any = {};
  Object.keys(row).forEach(key => {
    // Non cifriamo mai l'ID
    if (key === 'id') {
      encrypted[key] = row[key];
    } 
    // Cifriamo solo i campi definiti come sensibili
    else if (SENSITIVE_FIELDS.includes(key)) {
      encrypted[key] = encryptValue(row[key]);
    } else {
      encrypted[key] = row[key];
    }
  });
  return encrypted;
};

const decryptRow = (row: any) => {
  const decrypted: any = {};
  Object.keys(row).forEach(key => {
    if (key === 'id') {
      decrypted[key] = row[key];
    } else if (SENSITIVE_FIELDS.includes(key)) {
      decrypted[key] = decryptValue(row[key]);
    } else {
      decrypted[key] = row[key];
    }
  });
  return decrypted;
};

// Interface for DB drivers
interface IDatabase {
  select<T>(table: string): Promise<T[]>;
  insert<T extends { id: number }>(table: string, item: Omit<T, 'id'>): Promise<T>;
  update<T extends { id: number }>(table: string, id: number, updates: Partial<T>): Promise<T>;
  delete(table: string, id: number): Promise<void>;
}

// ==========================================
// MOCK STORAGE (LocalStorage)
// ==========================================
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class MockSheetDB implements IDatabase {
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

  async select<T>(table: string): Promise<T[]> {
    await delay(300);
    return this.get<T[]>(table, []);
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

// ==========================================
// REAL GOOGLE SHEETS STORAGE
// ==========================================
class GoogleSheetsDB implements IDatabase {
  private baseUrl: string;

  constructor(url: string) {
    this.baseUrl = url;
    console.log("🔌 KondoManager: Inizializzato con Google Sheets Backend");
  }

  async select<T>(table: string): Promise<T[]> {
    console.log(`📡 Fetching ${table}...`);
    try {
      const response = await fetch(`${this.baseUrl}?action=select&table=${table}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const text = await response.text();
      const json = JSON.parse(text);
      
      if (json.error) throw new Error(json.error);
      
      const data = json as T[];
      // Applica la decrittazione su ogni riga recuperata
      return data.map(row => decryptRow(row));
    } catch (e) {
      console.error(`Error selecting from ${table}:`, e);
      throw new Error("Errore di comunicazione con il database Google Sheets.");
    }
  }

  async insert<T extends { id: number }>(table: string, item: Omit<T, 'id'>): Promise<T> {
    console.log(`💾 Inserting into ${table}...`, item);
    // Cifra i dati prima di inviarli
    const encryptedItem = encryptRow(item);
    
    try {
      const response = await fetch(`${this.baseUrl}?action=insert&table=${table}`, {
        method: 'POST',
        // Usa 'text/plain' per evitare preflight OPTIONS request in alcuni setup GAS, 
        // anche se application/json è standard.
        body: JSON.stringify({ data: encryptedItem }), 
      });
      
      const text = await response.text();
      const data = JSON.parse(text);
      
      if (data.error) throw new Error(data.error);
      // Decifra la risposta (solitamente contiene l'ID generato e i dati)
      return decryptRow(data) as T;
    } catch (e) {
      console.error(`Error inserting into ${table}:`, e);
      throw new Error("Impossibile salvare i dati.");
    }
  }

  async update<T extends { id: number }>(table: string, id: number, updates: Partial<T>): Promise<T> {
    console.log(`📝 Updating ${table} ID ${id}...`);
    // Cifra gli aggiornamenti
    const encryptedUpdates = encryptRow(updates);

    try {
      const response = await fetch(`${this.baseUrl}?action=update&table=${table}&id=${id}`, {
        method: 'POST',
        body: JSON.stringify({ data: encryptedUpdates }),
      });

      const text = await response.text();
      const data = JSON.parse(text);
      
      if (data.error) throw new Error(data.error);
      return decryptRow(data) as T;
    } catch (e) {
      console.error(`Error updating ${table}:`, e);
      throw new Error("Impossibile aggiornare i dati.");
    }
  }

  async delete(table: string, id: number): Promise<void> {
    console.log(`🗑️ Deleting from ${table} ID ${id}...`);
    try {
      const response = await fetch(`${this.baseUrl}?action=delete&table=${table}&id=${id}`, {
        method: 'POST',
      });
      const text = await response.text();
      const data = JSON.parse(text);
      if (data.error) throw new Error(data.error);
    } catch (e) {
      console.error(`Error deleting from ${table}:`, e);
      throw new Error("Impossibile eliminare i dati.");
    }
  }
}

// Export checks
const isValidScriptUrl = GOOGLE_SCRIPT_URL && GOOGLE_SCRIPT_URL.includes("script.google.com");

if (!isValidScriptUrl) {
  console.warn("⚠️ MOCK MODE ATTIVA: Inserisci l'URL di Google Script in services/storage.ts per salvare i dati online.");
}

export const isMock = !isValidScriptUrl;
export const db: IDatabase = isMock ? new MockSheetDB() : new GoogleSheetsDB(GOOGLE_SCRIPT_URL);