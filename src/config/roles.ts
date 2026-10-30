// resources.ts imports Role back; that is safe because both only use each other inside functions
import { canAccessResource, parseResourceRight } from './resources';

// Roles are derived from user_info flags (isAdmin, isLibrarian); there is no role column.
export const Role = {
  USER: 'USER',
  LIBRARIAN: 'LIBRARIAN',
  ADMIN: 'ADMIN'
} as const;

export type Role = typeof Role[keyof typeof Role];

// Named rights for the dedicated endpoints. Table rights ("main.book_info:write") come from
// the access policy in ./resources.ts.
const allRoles: Record<Role, string[]> = {
  [Role.USER]: [],
  [Role.LIBRARIAN]: [],
  [Role.ADMIN]: ['getUsers', 'manageUsers']
};

export const roles = Object.keys(allRoles) as Role[];
export const roleRights = new Map<Role, string[]>(Object.entries(allRoles) as [Role, string[]][]);

export const getUserRole = (user: { isAdmin: boolean; isLibrarian: number }): Role => {
  if (user.isAdmin) return Role.ADMIN;
  if (user.isLibrarian) return Role.LIBRARIAN;
  return Role.USER;
};

export const hasRights = (role: Role, requiredRights: string[]): boolean => {
  const userRights = roleRights.get(role) ?? [];
  return requiredRights.every((requiredRight) => {
    const resource = parseResourceRight(requiredRight);
    if (resource) {
      return canAccessResource(role, resource.db, resource.table, resource.action);
    }
    return userRights.includes(requiredRight);
  });
};
