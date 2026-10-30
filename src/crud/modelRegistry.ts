import { Prisma as MainPrisma } from '@prisma/client';
import { Prisma as SciencePrisma } from '.prisma-science/client';
import prisma from '../client';
import sciencePrisma from '../scienceClient';
import { DbName, EXCLUDED_TABLES } from '../config/resources';

/**
 * Describes every table that gets generic CRUD endpoints, built from Prisma's runtime model
 * metadata (DMMF) for kcc_main and science_db. Validation, routes and Swagger docs are all
 * generated from this, so a `prisma db pull` + `prisma generate` is enough to pick up schema changes.
 */
export type FieldType =
  | 'String'
  | 'Int'
  | 'BigInt'
  | 'Float'
  | 'Decimal'
  | 'Boolean'
  | 'DateTime'
  | 'Bytes'
  | 'Enum';

export interface FieldMeta {
  name: string;
  type: FieldType;
  isId: boolean;
  isRequired: boolean;
  hasDefault: boolean;
  isAutoIncrement: boolean;
  /** MySQL column type from @db.*, e.g. "VarChar" with args ["255"] */
  nativeType?: string;
  nativeArgs: string[];
  enumValues?: string[];
  /** allowed members of a MySQL SET column (Prisma maps SET to a plain String) */
  setValues?: string[];
}

export interface CrudDelegate {
  findMany(args: object): Promise<unknown[]>;
  count(args: object): Promise<number>;
  findUnique(args: object): Promise<unknown | null>;
  create(args: object): Promise<unknown>;
  update(args: object): Promise<unknown>;
  delete(args: object): Promise<unknown>;
}

export interface ModelMeta {
  db: DbName;
  name: string;
  idField: FieldMeta;
  fields: FieldMeta[];
  /** resolved on each call so tests can swap the Prisma client module */
  delegate: () => CrudDelegate;
}

// Prisma has no SET type; these columns are SET in MySQL (see prisma/sql/*.schema.sql)
const SET_COLUMNS: Record<string, string[]> = {
  'main.internet_comment.status': ['approved', 'pending', 'suspended'],
  'main.success_info.status': ['approved', 'pending', 'suspended', 'draft'],
  'main.success_rating.status': ['approved', 'pending', 'suspended'],
  'main.user_info.theme': ['theme1', 'theme2', 'theme3']
};

type Dmmf = typeof MainPrisma.dmmf;

const toFieldMeta = (
  db: DbName,
  model: string,
  field: Dmmf['datamodel']['models'][number]['fields'][number],
  enums: Map<string, string[]>
): FieldMeta => {
  const isEnum = field.kind === 'enum';
  const defaultValue = field.default as { name?: string } | undefined;
  return {
    name: field.name,
    type: (isEnum ? 'Enum' : field.type) as FieldType,
    isId: field.isId,
    isRequired: field.isRequired,
    hasDefault: field.hasDefaultValue,
    isAutoIncrement: defaultValue?.name === 'autoincrement',
    nativeType: field.nativeType?.[0],
    nativeArgs: (field.nativeType?.[1] as string[] | undefined) ?? [],
    ...(isEnum && { enumValues: enums.get(field.type) ?? [] }),
    ...(SET_COLUMNS[`${db}.${model}.${field.name}`] && {
      setValues: SET_COLUMNS[`${db}.${model}.${field.name}`]
    })
  };
};

const buildModels = (db: DbName, dmmf: Dmmf, client: () => unknown): ModelMeta[] => {
  const enums = new Map(
    dmmf.datamodel.enums.map((e) => [e.name, e.values.map((v) => v.dbName ?? v.name)])
  );
  return dmmf.datamodel.models
    .filter((model) => !EXCLUDED_TABLES[db].includes(model.name))
    .flatMap((model) => {
      const fields = model.fields
        .filter((field) => field.kind === 'scalar' || field.kind === 'enum')
        .map((field) => toFieldMeta(db, model.name, field, enums));
      const idField = fields.find((field) => field.isId);
      // every introspected table has a single-column primary key; skip any that does not
      if (!idField) return [];
      return [
        {
          db,
          name: model.name,
          idField,
          fields,
          delegate: () => (client() as Record<string, CrudDelegate>)[model.name]
        }
      ];
    });
};

export const models: ModelMeta[] = [
  ...buildModels('main', MainPrisma.dmmf, () => prisma),
  ...buildModels('science', SciencePrisma.dmmf as unknown as Dmmf, () => sciencePrisma)
];

export const findModel = (db: DbName, name: string) =>
  models.find((model) => model.db === db && model.name === name);
