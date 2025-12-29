import CryptoJS from 'crypto-js';

// ==========================================
// CONFIGURATION
// ==========================================
// Paste your deployed Web App URL here. 
// If empty, the app will fall back to Mock (Browser LocalStorage) mode.
const GOOGLE_SCRIPT_URL = ""; 
// Example: "https://script.google.com/macros/s/AKfycbx.../exec"

const ENCRYPTION_KEY = "kondo-manager-secure-key-2025"; // In a production app, use an environment variable

// Campi che devono essere sempre crittografati nel database
const SENSITIVE_FIELDS = [
  'password_hash', 
  'two_factor_secret', 
  'remember_token',
  'password' // In caso venga usato in futuro
];

// ==========================================
// ENCRYPTION HELPERS
// ==========================================

const encryptValue = (value: any): string => {
  if (value === undefined || value === null) return "";
  try {
    // JSON.stringify ensures we preserve types (numbers vs strings) upon decryption
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
    if (!originalText) return ciphertext; // Return original if empty (might be plain text)
    return JSON.parse(originalText);
  } catch (e) {
    // Fallback: If decryption fails, it might be legacy plain text data
    return ciphertext;
  }
};

const encryptRow = (row: any) => {
  const encrypted: any = {};
  Object.keys(row).forEach(key => {
    // Non crittografare mai l'ID
    if (key === 'id') {
      encrypted[key] = row[key];
    } 
    // Crittografa solo se il campo è nella lista dei campi sensibili
    else if (SENSITIVE_FIELDS.includes(key)) {
      encrypted[key] = encryptValue(row[key]);
    } 
    // Altrimenti mantieni il valore in chiaro
    else {
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
    } 
    // Tenta la decrittografia solo per i campi sensibili
    else if (SENSITIVE_FIELDS.includes(key)) {
      decrypted[key] = decryptValue(row[key]);
    } 
    // Altrimenti usa il valore originale
    else {
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
    // Return empty array by default if no data exists
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
// REAL GOOGLE SHEETS STORAGE (With Encryption)
// ==========================================
class GoogleSheetsDB implements IDatabase {
  private baseUrl: string;

  constructor(url: string) {
    this.baseUrl = url;
  }

  async select<T>(table: string): Promise<T[]> {
    const response = await fetch(`${this.baseUrl}?action=select&table=${table}`);
    if (!response.ok) throw new Error('Network response was not ok');
    const json = await response.json();
    if (json.error) throw new Error(json.error);
    
    const data = json as T[];
    // Decrypt data coming from sheets
    return data.map(row => decryptRow(row));
  }

  async insert<T extends { id: number }>(table: string, item: Omit<T, 'id'>): Promise<T> {
    // Encrypt data before sending
    const encryptedItem = encryptRow(item);
    
    const response = await fetch(`${this.baseUrl}?action=insert&table=${table}`, {
      method: 'POST',
      body: JSON.stringify({ data: encryptedItem }),
    });
    
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    
    // The server usually returns the created item including the new ID.
    // If the server returns the data we sent (encrypted), we need to decrypt it 
    // or merge the ID with our local clear text version. 
    // Assuming server returns what was saved, we decrypt it.
    return decryptRow(data) as T;
  }

  async update<T extends { id: number }>(table: string, id: number, updates: Partial<T>): Promise<T> {
    // Encrypt updates before sending
    const encryptedUpdates = encryptRow(updates);

    const response = await fetch(`${this.baseUrl}?action=update&table=${table}&id=${id}`, {
      method: 'POST',
      body: JSON.stringify({ data: encryptedUpdates }),
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error);
    
    return decryptRow(data) as T;
  }

  async delete(table: string, id: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}?action=delete&table=${table}&id=${id}`, {
      method: 'POST',
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error);
  }
}

// Export the correct instance based on configuration
export const isMock = !GOOGLE_SCRIPT_URL;
export const db: IDatabase = isMock ? new MockSheetDB() : new GoogleSheetsDB(GOOGLE_SCRIPT_URL);