import { describe, test, expect } from '@jest/globals';
import SwaggerParser from '@apidevtools/swagger-parser';
import { buildSpec } from '../../../src/docs/openapiSpec';
import { models } from '../../../src/crud/modelRegistry';
import { isRequiredOnCreate } from '../../../src/crud/validation';
import { rolesWithAccess } from '../../../src/config/resources';

type Operation = { description: string; tags: string[]; security: unknown[] };
type Spec = {
  paths: Record<string, Record<string, Operation>>;
  components: {
    schemas: Record<string, { required?: string[]; properties: Record<string, unknown> }>;
  };
  tags: { name: string }[];
};

const spec = buildSpec() as unknown as Spec;

describe('OpenAPI spec', () => {
  test('is a valid OpenAPI 3 document', async () => {
    await expect(SwaggerParser.validate(JSON.parse(JSON.stringify(spec)))).resolves.toBeDefined();
  });

  test('still documents the auth and user endpoints', () => {
    for (const path of [
      '/auth/login',
      '/auth/me',
      '/auth/change-password',
      '/users/{id}/role',
      '/users/{id}/status'
    ]) {
      expect(spec.paths[path]).toBeDefined();
    }
  });
});

describe.each(models.map((meta) => [`${meta.db}.${meta.name}`, meta] as const))(
  'OpenAPI for %s',
  (label, meta) => {
    test('documents all five operations with auth and the allowed roles', () => {
      const collection = spec.paths[`/${meta.db}/${meta.name}`];
      const item = spec.paths[`/${meta.db}/${meta.name}/{id}`];
      expect(Object.keys(collection).sort()).toEqual(['get', 'post']);
      expect(Object.keys(item).sort()).toEqual(['delete', 'get', 'patch']);
      for (const operation of [
        collection.get,
        collection.post,
        item.get,
        item.patch,
        item.delete
      ]) {
        expect(operation.tags).toEqual([label]);
        expect(operation.security).toEqual([{ bearerAuth: [] }]);
      }
      expect(collection.get.description).toContain(
        rolesWithAccess(meta.db, meta.name, 'read').join(', ')
      );
      expect(collection.post.description).toContain(
        rolesWithAccess(meta.db, meta.name, 'write').join(', ')
      );
      expect(spec.tags.map((tag) => tag.name)).toContain(label);
    });

    test('has record, create and update schemas matching the columns', () => {
      const record = spec.components.schemas[label];
      const create = spec.components.schemas[`${label}.create`];
      const update = spec.components.schemas[`${label}.update`];
      expect(Object.keys(record.properties)).toEqual(meta.fields.map((f) => f.name));
      expect(create.required ?? []).toEqual(
        meta.fields
          .filter((f) => isRequiredOnCreate(f) && !(f.isId && f.isAutoIncrement))
          .map((f) => f.name)
      );
      expect(Object.keys(update.properties)).not.toContain(meta.idField.name);
    });
  }
);
