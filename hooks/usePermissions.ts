import { useAuth } from '../context/AuthContext';
import { ViewState } from '../types';

export const usePermissions = () => {
  const { user } = useAuth();

  const role = user?.role || 'user';

  // Helper generico per verificare i ruoli
  const hasRole = (allowedRoles: string[]) => allowedRoles.includes(role);

  // Definizioni di accesso alle Viste (Pagine)
  const canAccessView = (view: ViewState): boolean => {
    switch (view) {
      case 'dashboard':
        return hasRole(['admin', 'manager']); // Dashboard solo per staff
      case 'profile':
      case 'segnalazioni': // Tutti possono vedere e creare segnalazioni
        return true;
      case 'condomini': // Solo admin e manager possono vedere la lista
      case 'immobili':
      case 'anagrafiche':
        return hasRole(['admin', 'manager']);
      case 'comunicazioni': // Solo lo staff può inviare comunicazioni
        return hasRole(['admin', 'manager']);
      default:
        return false;
    }
  };

  // Definizioni di Permessi per Azioni specifiche
  const permissions = {
    // Condomini
    canCreateCondominio: hasRole(['admin']), // Solo admin
    canEditCondominio: hasRole(['admin']),
    canDeleteCondominio: hasRole(['admin']),

    // Unità Immobiliari
    canCreateImmobile: hasRole(['admin', 'manager']),
    canEditImmobile: hasRole(['admin', 'manager']),
    
    // Anagrafiche
    canCreateAnagrafica: hasRole(['admin', 'manager']),
    canEditAnagrafica: hasRole(['admin', 'manager']),
    canDeleteAnagrafica: hasRole(['admin']), // Solo admin cancella persone

    // Segnalazioni
    canManageTicketStatus: hasRole(['admin', 'manager']), // Cambiare stato o priorità
    canDeleteTicket: hasRole(['admin']),
    
    // Generico
    isAdmin: role === 'admin',
    isManager: role === 'manager',
    isStaff: hasRole(['admin', 'manager']), // Staff generico
  };

  return {
    role,
    canAccessView,
    ...permissions
  };
};