import { FieldMeta, ModelMeta } from '../../src/crud/modelRegistry';
import { maxLength } from '../../src/crud/validation';

/**
 * Valid sample values for any column, derived from the same metadata as the API validation.
 * Used by the per-model tests and the real-database CRUD sweep.
 */
export const sampleValue = (field: FieldMeta): unknown => {
  switch (field.type) {
    case 'Enum':
      return field.enumValues?.[0];
    case 'String':
      if (field.setValues) return field.setValues[0];
      return `s-${field.name}`.slice(0, maxLength(field));
    case 'Int':
    case 'BigInt':
      return 1;
    case 'Float':
      return 1.5;
    case 'Decimal':
      return 12;
    case 'Boolean':
      return true;
    case 'DateTime':
      return field.nativeType === 'Date' ? '2026-01-02' : '2026-01-02T03:04:05.000Z';
    case 'Bytes':
      return Buffer.from('abc').toString('base64');
    default:
      return null;
  }
};

/** A different valid value, to check that updates are applied */
export const changedValue = (field: FieldMeta): unknown => {
  switch (field.type) {
    case 'Enum':
      return field.enumValues?.[field.enumValues.length - 1];
    case 'String':
      if (field.setValues) return field.setValues[field.setValues.length - 1];
      return `u-${field.name}`.slice(0, maxLength(field));
    case 'Int':
    case 'BigInt':
      return 2;
    case 'Float':
      return 2.5;
    case 'Decimal':
      return 13;
    case 'Boolean':
      return false;
    case 'DateTime':
      return field.nativeType === 'Date' ? '2026-03-04' : '2026-03-04T05:06:07.000Z';
    case 'Bytes':
      return Buffer.from('xyz').toString('base64');
    default:
      return null;
  }
};

/** Body for POST: every column except an auto-increment id */
export const createPayload = (meta: ModelMeta): Record<string, unknown> =>
  Object.fromEntries(
    meta.fields
      .filter((field) => !(field.isId && field.isAutoIncrement))
      .map((field) => [field.name, field.isId ? `sample-${meta.name}` : sampleValue(field)])
  );

/** The first non-id column, used to test PATCH */
export const updateField = (meta: ModelMeta): FieldMeta =>
  meta.fields.find((field) => !field.isId) as FieldMeta;
