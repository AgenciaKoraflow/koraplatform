import { useAuth } from '@/hooks/useAuth';

export function usePermissions() {
  const { profile } = useAuth();
  const role = profile?.role;

  return {
    isAdmin: role === 'admin',
    isOperador: role === 'operador',
    isObservador: role === 'observador',
    canEdit: role !== 'observador',
    canManageSettings: role === 'admin',
    canManageUsers: role === 'admin',
    role: role ?? null,
  };
}
