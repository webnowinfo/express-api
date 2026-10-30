import { describe, test, expect } from '@jest/globals';
import { getUserRole, hasRights, Role } from '../../../src/config/roles';

describe('roles', () => {
  test('derives the role from isAdmin / isLibrarian', () => {
    expect(getUserRole({ isAdmin: true, isLibrarian: 1 })).toBe(Role.ADMIN);
    expect(getUserRole({ isAdmin: false, isLibrarian: 1 })).toBe(Role.LIBRARIAN);
    expect(getUserRole({ isAdmin: false, isLibrarian: 0 })).toBe(Role.USER);
  });

  test('only admins have user management rights', () => {
    expect(hasRights(Role.ADMIN, ['getUsers', 'manageUsers'])).toBe(true);
    expect(hasRights(Role.LIBRARIAN, ['getUsers'])).toBe(false);
    expect(hasRights(Role.USER, ['manageUsers'])).toBe(false);
  });

  test('no required rights is always allowed', () => {
    expect(hasRights(Role.USER, [])).toBe(true);
  });
});
