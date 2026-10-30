import { rolesWithAccess } from '../config/resources';
import { FieldMeta, ModelMeta, models } from './modelRegistry';
import { intRange, isRequiredOnCreate, maxLength } from './validation';

/** OpenAPI 3.0 paths, schemas and tags for the generic CRUD routes, generated from modelRegistry */
type Schema = Record<string, unknown>;

const DB_LABELS = { main: 'kcc_main', science: 'science_db' } as const;

const schemaName = (meta: ModelMeta, suffix = '') => `${meta.db}.${meta.name}${suffix}`;
const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });

const fieldSchema = (field: FieldMeta, forResponse: boolean): Schema => {
  const nullable = field.isRequired ? {} : { nullable: true };
  switch (field.type) {
    case 'Enum':
      return { type: 'string', enum: field.enumValues, ...nullable };
    case 'String':
      if (field.setValues) {
        return {
          type: 'string',
          description: `Comma-separated subset of: ${field.setValues.join(', ')}`,
          example: field.setValues[0],
          ...nullable
        };
      }
      return { type: 'string', maxLength: maxLength(field), ...nullable };
    case 'Int': {
      const [minimum, maximum] = intRange(field);
      return { type: 'integer', minimum, maximum, ...nullable };
    }
    case 'BigInt': {
      const [minimum] = intRange(field);
      return { type: 'integer', format: 'int64', minimum, ...nullable };
    }
    case 'Float':
      return { type: 'number', ...nullable };
    case 'Decimal':
      // Prisma serializes Decimal values as strings
      return forResponse
        ? { type: 'string', format: 'decimal', ...nullable }
        : { type: 'number', ...nullable };
    case 'Boolean':
      return { type: 'boolean', ...nullable };
    case 'DateTime':
      return {
        type: 'string',
        format: field.nativeType === 'Date' ? 'date' : 'date-time',
        ...nullable
      };
    case 'Bytes':
      return { type: 'string', format: 'byte', description: 'base64', ...nullable };
    default:
      return {};
  }
};

const properties = (fields: FieldMeta[], forResponse: boolean) =>
  Object.fromEntries(fields.map((field) => [field.name, fieldSchema(field, forResponse)]));

const modelSchemas = (meta: ModelMeta): Record<string, Schema> => {
  const createFields = meta.fields.filter((f) => !(f.isId && f.isAutoIncrement));
  const updateFields = meta.fields.filter((f) => !f.isId);
  const requiredOnCreate = createFields.filter(isRequiredOnCreate).map((f) => f.name);
  return {
    [schemaName(meta)]: {
      type: 'object',
      properties: properties(meta.fields, true),
      required: meta.fields.map((f) => f.name)
    },
    [schemaName(meta, '.create')]: {
      type: 'object',
      properties: properties(createFields, false),
      ...(requiredOnCreate.length && { required: requiredOnCreate }),
      additionalProperties: false
    },
    [schemaName(meta, '.update')]: {
      type: 'object',
      properties: properties(updateFields, false),
      minProperties: 1,
      additionalProperties: false
    }
  };
};

const accessNote = (meta: ModelMeta, action: 'read' | 'write') =>
  `Allowed roles: ${rolesWithAccess(meta.db, meta.name, action).join(', ')}.`;

const errorResponses = (codes: number[]) =>
  Object.fromEntries(
    codes.map((code) => {
      switch (code) {
        case 400:
          return [
            '400',
            {
              description: 'Invalid request',
              content: { 'application/json': { schema: ref('Error') } }
            }
          ];
        case 401:
          return ['401', { $ref: '#/components/responses/Unauthorized' }];
        case 403:
          return ['403', { $ref: '#/components/responses/Forbidden' }];
        default:
          return ['404', { $ref: '#/components/responses/NotFound' }];
      }
    })
  );

const modelPaths = (meta: ModelMeta): Record<string, Schema> => {
  const tag = schemaName(meta);
  const security = [{ bearerAuth: [] }];
  const idParam = {
    in: 'path',
    name: 'id',
    required: true,
    schema: fieldSchema({ ...meta.idField, isRequired: true }, false),
    description: `${meta.name}.${meta.idField.name}`
  };
  const filterParams = meta.fields
    .filter((f) => f.type !== 'Bytes')
    .map((f) => ({
      in: 'query',
      name: f.name,
      schema: fieldSchema({ ...f, isRequired: true }, false),
      description: `Only rows where ${f.name} equals this value`
    }));
  const sortable = meta.fields.filter((f) => f.type !== 'Bytes').map((f) => f.name);

  return {
    [`/${meta.db}/${meta.name}`]: {
      get: {
        summary: `List ${meta.name}`,
        description: accessNote(meta, 'read'),
        tags: [tag],
        security,
        parameters: [
          { in: 'query', name: 'page', schema: { type: 'integer', minimum: 1, default: 1 } },
          {
            in: 'query',
            name: 'limit',
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 }
          },
          {
            in: 'query',
            name: 'sortBy',
            schema: { type: 'string', enum: sortable, default: meta.idField.name }
          },
          {
            in: 'query',
            name: 'sortType',
            schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' }
          },
          ...filterParams
        ],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    results: { type: 'array', items: ref(schemaName(meta)) },
                    page: { type: 'integer' },
                    limit: { type: 'integer' },
                    totalPages: { type: 'integer' },
                    totalResults: { type: 'integer' }
                  }
                }
              }
            }
          },
          ...errorResponses([400, 401, 403])
        }
      },
      post: {
        summary: `Create ${meta.name}`,
        description: accessNote(meta, 'write'),
        tags: [tag],
        security,
        requestBody: {
          required: true,
          content: { 'application/json': { schema: ref(schemaName(meta, '.create')) } }
        },
        responses: {
          '201': {
            description: 'Created',
            content: { 'application/json': { schema: ref(schemaName(meta)) } }
          },
          ...errorResponses([400, 401, 403])
        }
      }
    },
    [`/${meta.db}/${meta.name}/{id}`]: {
      get: {
        summary: `Get ${meta.name}`,
        description: accessNote(meta, 'read'),
        tags: [tag],
        security,
        parameters: [idParam],
        responses: {
          '200': {
            description: 'OK',
            content: { 'application/json': { schema: ref(schemaName(meta)) } }
          },
          ...errorResponses([400, 401, 403, 404])
        }
      },
      patch: {
        summary: `Update ${meta.name}`,
        description: `${accessNote(meta, 'write')} Only the fields sent are changed.`,
        tags: [tag],
        security,
        parameters: [idParam],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: ref(schemaName(meta, '.update')) } }
        },
        responses: {
          '200': {
            description: 'OK',
            content: { 'application/json': { schema: ref(schemaName(meta)) } }
          },
          ...errorResponses([400, 401, 403, 404])
        }
      },
      delete: {
        summary: `Delete ${meta.name}`,
        description: accessNote(meta, 'write'),
        tags: [tag],
        security,
        parameters: [idParam],
        responses: {
          '204': { description: 'No content' },
          ...errorResponses([400, 401, 403, 404])
        }
      }
    }
  };
};

export const buildCrudOpenApi = () => ({
  tags: models.map((meta) => ({
    name: schemaName(meta),
    description: `${DB_LABELS[meta.db]}.${meta.name} — read: ${rolesWithAccess(
      meta.db,
      meta.name,
      'read'
    ).join(', ')}; write: ${rolesWithAccess(meta.db, meta.name, 'write').join(', ')}`
  })),
  paths: Object.assign({}, ...models.map(modelPaths)) as Record<string, Schema>,
  schemas: Object.assign({}, ...models.map(modelSchemas)) as Record<string, Schema>
});
