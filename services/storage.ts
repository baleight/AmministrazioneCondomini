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
const SENSITIVE_FIELDS = [
  'password_hash', 
  'two_factor_secret', 
  'remember_token',
  'password' 
];

// ==========================================
// ENCRYPTION HELPERS
// ==========================================

const encryptValue = (value: any): string => {
  if (value === undefined || value === null) return "";
  try {
    return CryptoJS.AES.encrypt(JSON.stringify(value), ENCRYPTION_KEY).toString();
  } catch (e) {
    console.error("Encryption failed", e);
    return String(value);
  }
};

const decryptValue = (ciphertext: string): any => {
  if (!ciphertext || typeof ciphertext !== 'string') return ciphertext;
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    if (!originalText) return ciphertext; 
    return JSON.parse(originalText);
  } catch (e) {
    return ciphertext;
  }
};

const encryptRow = (row: any) => {
  const encrypted: any = {};
  Object.keys(row).forEach(key => {
    if (key === 'id') {
      encrypted[key] = row[key];
    } else if (SENSITIVE_FIELDS.includes(key)) {
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
    const response = await fetch(`${this.baseUrl}?action=select&table=${table}`);
    if (!response.ok) throw new Error('Network response was not ok');
    const text = await response.text();
    try {
      const json = JSON.parse(text);
      if (json.error) throw new Error(json.error);
      const data = json as T[];
      return data.map(row => decryptRow(row));
    } catch (e) {
      console.error("Invalid JSON response:", text.substring(0, 100));
      throw new Error("Il server ha restituito una risposta non valida. Verifica l'URL dello script.");
    }
  }

  async insert<T extends { id: number }>(table: string, item: Omit<T, 'id'>): Promise<T> {
    console.log(`💾 Inserting into ${table}...`, item);
    const encryptedItem = encryptRow(item);
    
    const response = await fetch(`${this.baseUrl}?action=insert&table=${table}`, {
      method: 'POST',
      body: JSON.stringify({ data: encryptedItem }), 
    });
    
    const text = await response.text();
    try {
      const data = JSON.parse(text);
      if (data.error) throw new Error(data.error);
      return decryptRow(data) as T;
    } catch (e) {
      throw new Error("Risposta server non valida durante il salvataggio.");
    }
  }

  async update<T extends { id: number }>(table: string, id: number, updates: Partial<T>): Promise<T> {
    console.log(`📝 Updating ${table} ID ${id}...`);
    const encryptedUpdates = encryptRow(updates);

    const response = await fetch(`${this.baseUrl}?action=update&table=${table}&id=${id}`, {
      method: 'POST',
      body: JSON.stringify({ data: encryptedUpdates }),
    });

    const text = await response.text();
    try {
      const data = JSON.parse(text);
      if (data.error) throw new Error(data.error);
      return decryptRow(data) as T;
    } catch (e) {
      throw new Error("Risposta server non valida durante l'aggiornamento.");
    }
  }

  async delete(table: string, id: number): Promise<void> {
    console.log(`🗑️ Deleting from ${table} ID ${id}...`);
    const response = await fetch(`${this.baseUrl}?action=delete&table=${table}&id=${id}`, {
      method: 'POST',
    });
    const text = await response.text();
    try {
      const data = JSON.parse(text);
      if (data.error) throw new Error(data.error);
    } catch (e) {
      throw new Error("Risposta server non valida durante l'eliminazione.");
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