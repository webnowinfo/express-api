import { Role } from './roles';

/**
 * Access policy for the generic CRUD endpoints (/v1/main/<table>, /v1/science/<table>).
 *
 * - ADMIN:     read + write on every table
 * - LIBRARIAN: read on non-sensitive tables, write on book_* tables
 * - USER:      read on non-sensitive tables
 * - Sensitive tables (logs, messages, sessions, captcha, private data, orders, reports,
 *   search history) are admin-only.
 *
 * Edit this file to change who can do what; routes, /auth/me and the Swagger docs all read it.
 */
export type DbName = 'main' | 'science';
export type ResourceAction = 'read' | 'write';

// Tables served by dedicated endpoints (/v1/users, /v1/users/:id/permissions) instead of generic CRUD
export const EXCLUDED_TABLES: Record<DbName, string[]> = {
  main: ['user_info', 'user_permission'],
  science: []
};

const SENSITIVE_TABLES: Record<DbName, (string | RegExp)[]> = {
  main: [
    /^log_/,
    /^template_log_/,
    /^private_data_/,
    'session_info',
    'tbl_captcha',
    'apply_privatedata_info',
    'data_order',
    'overseas_data_order',
    'report_info',
    'opinion_info',
    'search_keyword'
  ],
  science: ['session_info']
};

const LIBRARIAN_WRITABLE_TABLES: Record<DbName, (string | RegExp)[]> = {
  main: [/^book_/],
  science: []
};

const matches = (patterns: (string | RegExp)[], table: string) =>
  patterns.some((pattern) =>
    typeof pattern === 'string' ? pattern === table : pattern.test(table)
  );

export const isSensitiveTable = (db: DbName, table: string) => matches(SENSITIVE_TABLES[db], table);

export const canAccessResource = (
  role: Role,
  db: DbName,
  table: string,
  action: ResourceAction
): boolean => {
  if (role === Role.ADMIN) return true;
  if (isSensitiveTable(db, table)) return false;
  if (action === 'read') return true;
  return role === Role.LIBRARIAN && matches(LIBRARIAN_WRITABLE_TABLES[db], table);
};

export const resourceRight = (db: DbName, table: string, action: ResourceAction) =>
  `${db}.${table}:${action}`;

const RESOURCE_RIGHT_PATTERN = /^(main|science)\.(\w+):(read|write)$/;

export const parseResourceRight = (
  right: string
): { db: DbName; table: string; action: ResourceAction } | null => {
  const match = RESOURCE_RIGHT_PATTERN.exec(right);
  if (!match) return null;
  return { db: match[1] as DbName, table: match[2], action: match[3] as ResourceAction };
};

export const rolesWithAccess = (db: DbName, table: string, action: ResourceAction): Role[] =>
  Object.values(Role).filter((role) => canAccessResource(role, db, table, action));
