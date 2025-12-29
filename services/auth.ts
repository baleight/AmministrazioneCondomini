import { db } from './storage';
import { Anagrafica, User } from '../types';

// Mock Admin Credentials
const ADMIN_CREDENTIALS = {
  email: 'admin@kondo.it',
  password: 'password', // In production, this should be handled by a real backend
  name: 'Amministratore',
  id: 0
};

export const AuthService = {
  login: async (email: string, password: string): Promise<User | null> => {
    // 1. Check if it's the Admin
    if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
      return {
        id: ADMIN_CREDENTIALS.id,
        name: ADMIN_CREDENTIALS.name,
        email: ADMIN_CREDENTIALS.email,
        role: 'admin'
      };
    }

    // 2. If not admin, check against the 'anagrafiche' list (Users)
    // We treat 'codice_fiscale' as the password for this MVP
    try {
      const users = await db.select<Anagrafica>('anagrafiche');
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (user && user.codice_fiscale === password) {
        return {
          id: user.id,
          name: user.nome,
          email: user.email,
          role: 'user' // Mapping owner/tenant to generic 'user' access for the app
        };
      }
    } catch (error) {
      console.error("Login verification failed", error);
    }

    return null;
  }
};