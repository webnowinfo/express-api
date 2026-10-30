import { describe, test, expect } from '@jest/globals';
import {
  DbName,
  ResourceAction,
  canAccessResource,
  isSensitiveTable,
  parseResourceRight,
  resourceRight,
  rolesWithAccess
} from '../../../src/config/resources';
import { hasRights, Role } from '../../../src/config/roles';

describe('table access policy', () => {
  const cases: [Role, DbName, string, ResourceAction, boolean][] = [
    // role, db, table, action, allowed
    [Role.ADMIN, 'main', 'article_info', 'write', true],
    [Role.ADMIN, 'main', 'log_message', 'read', true],
    [Role.ADMIN, 'science', 'session_info', 'write', true],
    [Role.LIBRARIAN, 'main', 'book_info', 'write', true],
    [Role.LIBRARIAN, 'main', 'book_lend_log', 'write', true],
    [Role.LIBRARIAN, 'main', 'article_info', 'read', true],
    [Role.LIBRARIAN, 'main', 'article_info', 'write', false],
    [Role.LIBRARIAN, 'science', 'room_plan', 'write', false],
    [Role.LIBRARIAN, 'main', 'log_article', 'read', false],
    [Role.USER, 'main', 'article_info', 'read', true],
    [Role.USER, 'science', 'room_plan', 'read', true],
    [Role.USER, 'main', 'book_info', 'write', false],
    [Role.USER, 'main', 'log_message', 'read', false],
    [Role.USER, 'main', 'template_log_user', 'read', false],
    [Role.USER, 'main', 'private_data_list', 'read', false],
    [Role.USER, 'main', 'search_keyword', 'read', false],
    [Role.USER, 'science', 'session_info', 'read', false]
  ];

  test.each(cases)('%s %s.%s %s -> %s', (role, db, table, action, allowed) => {
    expect(canAccessResource(role, db, table, action)).toBe(allowed);
  });

  test('marks logs, sessions, captcha, private data, orders, reports and search history sensitive', () => {
    for (const table of [
      'log_inout',
      'template_log_access',
      'session_info',
      'tbl_captcha',
      'private_data_info',
      'apply_privatedata_info',
      'data_order',
      'overseas_data_order',
      'report_info',
      'opinion_info',
      'search_keyword'
    ]) {
      expect(isSensitiveTable('main', table)).toBe(true);
    }
    expect(isSensitiveTable('main', 'book_info')).toBe(false);
  });

  test('lists the roles allowed for an action', () => {
    expect(rolesWithAccess('main', 'book_info', 'write')).toEqual([Role.LIBRARIAN, Role.ADMIN]);
    expect(rolesWithAccess('main', 'log_message', 'read')).toEqual([Role.ADMIN]);
  });

  test('round-trips resource rights', () => {
    expect(parseResourceRight(resourceRight('science', 'room_plan', 'read'))).toEqual({
      db: 'science',
      table: 'room_plan',
      action: 'read'
    });
    expect(parseResourceRight('manageUsers')).toBeNull();
  });

  test('hasRights checks table rights through the policy and named rights through the role map', () => {
    expect(hasRights(Role.LIBRARIAN, ['main.book_info:write', 'main.article_info:read'])).toBe(
      true
    );
    expect(hasRights(Role.LIBRARIAN, ['main.book_info:write', 'manageUsers'])).toBe(false);
    expect(hasRights(Role.ADMIN, ['main.log_message:write', 'manageUsers'])).toBe(true);
  });
});
