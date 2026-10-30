import Joi from 'joi';
import { FieldMeta, ModelMeta } from './modelRegistry';

// MySQL integer ranges by @db native type (no native type = INT)
const INT_RANGES: Record<string, [number, number]> = {
  TinyInt: [-128, 127],
  UnsignedTinyInt: [0, 255],
  SmallInt: [-32768, 32767],
  UnsignedSmallInt: [0, 65535],
  MediumInt: [-8388608, 8388607],
  UnsignedMediumInt: [0, 16777215],
  Int: [-2147483648, 2147483647],
  UnsignedInt: [0, 4294967295],
  BigInt: [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
  UnsignedBigInt: [0, Number.MAX_SAFE_INTEGER]
};

// Max characters (strings) or bytes (binary) by native type when it has no length argument
const TEXT_LIMITS: Record<string, number> = {
  TinyText: 255,
  Text: 65535,
  MediumText: 16777215,
  LongText: 4294967295,
  TinyBlob: 255,
  Blob: 65535,
  MediumBlob: 16777215,
  LongBlob: 4294967295
};

// Prisma's default String column on MySQL is VARCHAR(191)
const DEFAULT_STRING_LENGTH = 191;

// MySQL TIMESTAMP range
const TIMESTAMP_MIN = new Date('1970-01-01T00:00:01Z');
const TIMESTAMP_MAX = new Date('2038-01-19T03:14:07Z');

export const maxLength = (field: FieldMeta): number => {
  if (field.nativeType && field.nativeArgs.length) return Number(field.nativeArgs[0]);
  if (field.nativeType && TEXT_LIMITS[field.nativeType]) return TEXT_LIMITS[field.nativeType];
  return DEFAULT_STRING_LENGTH;
};

export const intRange = (field: FieldMeta): [number, number] => {
  if (field.nativeType && INT_RANGES[field.nativeType]) return INT_RANGES[field.nativeType];
  return field.type === 'BigInt' ? INT_RANGES.BigInt : INT_RANGES.Int;
};

const setValidator =
  (allowed: string[]): Joi.CustomValidator<string> =>
  (value, helpers) => {
    const parts = value === '' ? [] : value.split(',');
    const invalid = parts.filter((part) => !allowed.includes(part));
    if (invalid.length || new Set(parts).size !== parts.length) {
      return helpers.message({
        custom: `{{#label}} must be a comma-separated list of: ${allowed.join(', ')}`
      });
    }
    return value;
  };

const bytesValidator =
  (limit: number): Joi.CustomValidator<string> =>
  (value, helpers) => {
    if (Buffer.from(value, 'base64').length > limit) {
      return helpers.message({ custom: `{{#label}} must be at most ${limit} bytes` });
    }
    return value;
  };

/** Joi rule for one column, without required/nullable handling */
export const fieldValidator = (field: FieldMeta): Joi.Schema => {
  switch (field.type) {
    case 'Enum':
      return Joi.string().valid(...(field.enumValues ?? []));
    case 'String':
      if (field.setValues) {
        return Joi.string().allow('').custom(setValidator(field.setValues));
      }
      return Joi.string().allow('').max(maxLength(field));
    case 'Int':
    case 'BigInt': {
      const [min, max] = intRange(field);
      return Joi.number().integer().min(min).max(max);
    }
    case 'Float':
    case 'Decimal':
      return Joi.number();
    case 'Boolean':
      return Joi.boolean();
    case 'DateTime':
      return field.nativeType === 'Timestamp'
        ? Joi.date().iso().min(TIMESTAMP_MIN).max(TIMESTAMP_MAX)
        : Joi.date().iso();
    case 'Bytes':
      return Joi.string()
        .allow('')
        .base64({ paddingRequired: true })
        .custom(bytesValidator(maxLength(field)))
        .description('base64');
    default:
      return Joi.any();
  }
};

/** Required when creating: NOT NULL without a database default (auto-increment ids are never sent) */
export const isRequiredOnCreate = (field: FieldMeta) =>
  field.isRequired && !field.hasDefault && !field.isAutoIncrement;

const writableFields = (meta: ModelMeta, includeId: boolean) =>
  meta.fields.filter((field) => (field.isId ? includeId : true));

// Bytes columns are not filterable or sortable
const queryableFields = (meta: ModelMeta) => meta.fields.filter((field) => field.type !== 'Bytes');

const idValidator = (meta: ModelMeta) =>
  meta.idField.type === 'String'
    ? Joi.string().max(maxLength(meta.idField)).required()
    : Joi.number().integer().min(0).max(intRange(meta.idField)[1]).required();

export interface CrudSchemas {
  list: { query: Joi.ObjectSchema };
  get: { params: Joi.ObjectSchema };
  create: { body: Joi.ObjectSchema };
  update: { params: Joi.ObjectSchema; body: Joi.ObjectSchema };
  remove: { params: Joi.ObjectSchema };
}

export const buildSchemas = (meta: ModelMeta): CrudSchemas => {
  const params = Joi.object({ id: idValidator(meta) });

  // non-auto-increment ids (e.g. session_info.id) are supplied by the client on create
  const createKeys = Object.fromEntries(
    writableFields(meta, !meta.idField.isAutoIncrement).map((field) => {
      let rule = fieldValidator(field);
      if (!field.isRequired) rule = rule.allow(null);
      return [field.name, isRequiredOnCreate(field) ? rule.required() : rule];
    })
  );

  const updateKeys = Object.fromEntries(
    writableFields(meta, false).map((field) => {
      const rule = fieldValidator(field);
      return [field.name, field.isRequired ? rule : rule.allow(null)];
    })
  );

  const sortable = queryableFields(meta).map((field) => field.name);
  const listKeys = {
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(100),
    sortBy: Joi.string().valid(...sortable),
    sortType: Joi.string().valid('asc', 'desc'),
    ...Object.fromEntries(queryableFields(meta).map((field) => [field.name, fieldValidator(field)]))
  };

  return {
    list: { query: Joi.object(listKeys) },
    get: { params },
    create: { body: Joi.object(createKeys) },
    update: { params, body: Joi.object(updateKeys).min(1) },
    remove: { params }
  };
};
