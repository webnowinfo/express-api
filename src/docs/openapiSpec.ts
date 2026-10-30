import swaggerJsdoc from 'swagger-jsdoc';
import swaggerDefinition from './swaggerDef';
import { buildCrudOpenApi } from '../crud/openapi';

type OpenApiSpec = {
  tags?: { name: string; description?: string }[];
  paths?: Record<string, unknown>;
  components?: { schemas?: Record<string, unknown>; [key: string]: unknown };
  [key: string]: unknown;
};

/** Full OpenAPI spec: JSDoc-annotated routes (auth, users) plus the generated table CRUD routes */
export const buildSpec = (): OpenApiSpec => {
  const spec = swaggerJsdoc({
    swaggerDefinition,
    apis: ['src/docs/*.yml', 'src/routes/v1/*.ts']
  }) as OpenApiSpec;
  const crud = buildCrudOpenApi();
  return {
    ...spec,
    tags: [...(spec.tags ?? []), ...crud.tags],
    paths: { ...spec.paths, ...crud.paths },
    components: {
      ...spec.components,
      schemas: { ...spec.components?.schemas, ...crud.schemas }
    }
  };
};
