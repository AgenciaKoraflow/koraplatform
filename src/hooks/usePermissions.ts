export function usePermissions() {
  return {
    isAdmin: true,
    isOperador: true,
    isObservador: false,
    canEdit: true,
    canManageSettings: true,
    canManageUsers: true,
    role: null,
  };
}
