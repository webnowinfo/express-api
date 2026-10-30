import { describe, test, expect } from '@jest/globals';
import Joi from 'joi';
import { models, findModel, ModelMeta } from '../../../src/crud/modelRegistry';
import { buildSchemas, isRequiredOnCreate } from '../../../src/crud/validation';
import { createPayload, changedValue, updateField } from '../../utils/sampleData';

const validate = (schema: Joi.ObjectSchema, value: unknown) =>
  schema.prefs({ errors: { label: 'key' }, abortEarly: false }).validate(value);

const model = (db: 'main' | 'science', name: string) => findModel(db, name) as ModelMeta;

describe('model registry', () => {
  test('covers every table except the ones served by /v1/users', () => {
    expect(models.filter((m) => m.db === 'main')).toHaveLength(70);
    expect(models.filter((m) => m.db === 'science')).toHaveLength(34);
    expect(findModel('main', 'user_info')).toBeUndefined();
    expect(findModel('main', 'user_permission')).toBeUndefined();
  });
});

describe.each(models.map((meta) => [`${meta.db}.${meta.name}`, meta] as const))(
  'validation for %s',
  (label, meta) => {
    const schemas = buildSchemas(meta);

    test('accepts a full sample row on create', () => {
      expect(validate(schemas.create.body, createPayload(meta)).error).toBeUndefined();
    });

    test('rejects create without required columns', () => {
      const required = meta.fields.filter(
        (field) => isRequiredOnCreate(field) && !(field.isId && field.isAutoIncrement)
      );
      if (!required.length) return;
      const payload = createPayload(meta);
      delete payload[required[0].name];
      expect(validate(schemas.create.body, payload).error?.message).toContain(
        `"${required[0].name}" is required`
      );
    });

    test('rejects unknown columns', () => {
      const error = validate(schemas.create.body, { ...createPayload(meta), notAColumn: 1 }).error;
      expect(error?.message).toContain('"notAColumn" is not allowed');
    });

    test('accepts a partial update and rejects an empty one or an id change', () => {
      const field = updateField(meta);
      expect(
        validate(schemas.update.body, { [field.name]: changedValue(field) }).error
      ).toBeUndefined();
      expect(validate(schemas.update.body, {}).error).toBeDefined();
      expect(validate(schemas.update.body, { [meta.idField.name]: 1 }).error).toBeDefined();
    });

    test('accepts list paging/sorting and rejects unknown sort columns', () => {
      expect(
        validate(schemas.list.query, {
          page: '2',
          limit: '5',
          sortBy: meta.idField.name,
          sortType: 'asc'
        }).error
      ).toBeUndefined();
      expect(validate(schemas.list.query, { sortBy: 'notAColumn' }).error).toBeDefined();
      expect(validate(schemas.list.query, { limit: '101' }).error).toBeDefined();
    });

    test('validates the id route parameter', () => {
      const valid = meta.idField.type === 'String' ? 'abc' : '5';
      expect(validate(schemas.get.params, { id: valid }).error).toBeUndefined();
      if (meta.idField.type !== 'String') {
        expect(validate(schemas.get.params, { id: 'abc' }).error).toBeDefined();
      }
    });
  }
);

describe('column type rules', () => {
  test('VARCHAR(n) limits length', () => {
    const { create } = buildSchemas(model('main', 'article_info'));
    const payload = { ...createPayload(model('main', 'article_info')), title: 'x'.repeat(256) };
    expect(validate(create.body, payload).error?.message).toContain(
      '"title" length must be less than or equal to 255'
    );
  });

  test('unsigned and tinyint ranges are enforced', () => {
    const { update } = buildSchemas(model('main', 'book_info'));
    expect(validate(update.body, { printYear: -1 }).error).toBeDefined(); // UNSIGNED INT
    expect(validate(update.body, { classID: 128 }).error).toBeDefined(); // TINYINT
    expect(validate(update.body, { classID: 127 }).error).toBeUndefined();
  });

  test('enum columns only accept their values', () => {
    const { update } = buildSchemas(model('main', 'article_info'));
    expect(validate(update.body, { status: 'approved' }).error).toBeUndefined();
    expect(validate(update.body, { status: 'deleted' }).error).toBeDefined();
  });

  test('nullable columns accept null, NOT NULL columns do not', () => {
    const { update } = buildSchemas(model('main', 'article_info'));
    expect(validate(update.body, { processTime: null }).error).toBeUndefined();
    expect(validate(update.body, { title: null }).error).toBeDefined();
  });

  test('TIMESTAMP columns are limited to the MySQL range', () => {
    const { update } = buildSchemas(model('main', 'basic_theme'));
    expect(validate(update.body, { updateDate: '2030-01-01T00:00:00Z' }).error).toBeUndefined();
    expect(validate(update.body, { updateDate: '2040-01-01T00:00:00Z' }).error).toBeDefined();
  });

  test('SET columns accept comma-separated allowed values only', () => {
    const { update } = buildSchemas(model('main', 'internet_comment'));
    expect(validate(update.body, { status: 'approved,pending' }).error).toBeUndefined();
    expect(validate(update.body, { status: '' }).error).toBeUndefined();
    expect(validate(update.body, { status: 'approved,approved' }).error).toBeDefined();
    expect(validate(update.body, { status: 'deleted' }).error?.message).toContain(
      'must be a comma-separated list of: approved, pending, suspended'
    );
  });

  test('BLOB/VARBINARY columns take base64 within the column size', () => {
    const { update } = buildSchemas(model('science', 'basic_item'));
    expect(
      validate(update.body, { unit: Buffer.from('kg').toString('base64') }).error
    ).toBeUndefined();
    expect(validate(update.body, { unit: 'not base64!' }).error).toBeDefined();
    expect(
      validate(update.body, { unit: Buffer.alloc(101).toString('base64') }).error?.message
    ).toContain('must be at most 100 bytes');
  });

  test('string primary keys are supplied on create', () => {
    const meta = model('main', 'session_info');
    const payload = createPayload(meta);
    delete payload.id;
    expect(validate(buildSchemas(meta).create.body, payload).error?.message).toContain(
      '"id" is required'
    );
  });

  test('list filters are converted to column types', () => {
    const { value } = validate(buildSchemas(model('main', 'article_info')).list.query, {
      userID: '7',
      isRecomm: 'true',
      insertTime: '2026-01-01T00:00:00Z'
    });
    expect(value).toEqual({
      userID: 7,
      isRecomm: true,
      insertTime: new Date('2026-01-01T00:00:00Z')
    });
  });
});
