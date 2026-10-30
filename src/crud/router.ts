import express from 'express';
import httpStatus from 'http-status';
import { authStrict } from '../middlewares/auth';
import validate from '../middlewares/validate';
import catchAsync from '../utils/catchAsync';
import { resourceRight } from '../config/resources';
import { models } from './modelRegistry';
import { buildSchemas } from './validation';
import { createCrudService, ListOptions } from './service';

/**
 * Generic CRUD routes for every table in models (see modelRegistry):
 *   GET    /<db>/<table>       list (page, limit, sortBy, sortType, equality filters on columns)
 *   POST   /<db>/<table>       create
 *   GET    /<db>/<table>/:id   read one
 *   PATCH  /<db>/<table>/:id   update
 *   DELETE /<db>/<table>/:id   delete
 * Access comes from the policy in config/resources.ts. Swagger docs: crud/openapi.ts.
 */
const router = express.Router();

for (const meta of models) {
  const base = `/${meta.db}/${meta.name}`;
  const schemas = buildSchemas(meta);
  const service = createCrudService(meta);
  const canRead = authStrict(resourceRight(meta.db, meta.name, 'read'));
  const canWrite = authStrict(resourceRight(meta.db, meta.name, 'write'));

  router
    .route(base)
    .get(
      canRead,
      validate(schemas.list),
      catchAsync(async (req, res) => {
        const { page, limit, sortBy, sortType, ...filter } = req.query;
        res.send(await service.list(filter, { page, limit, sortBy, sortType } as ListOptions));
      })
    )
    .post(
      canWrite,
      validate(schemas.create),
      catchAsync(async (req, res) => {
        res.status(httpStatus.CREATED).send(await service.create(req.body));
      })
    );

  router
    .route(`${base}/:id`)
    .get(
      canRead,
      validate(schemas.get),
      catchAsync(async (req, res) => {
        res.send(await service.get(req.params.id));
      })
    )
    .patch(
      canWrite,
      validate(schemas.update),
      catchAsync(async (req, res) => {
        res.send(await service.update(req.params.id, req.body));
      })
    )
    .delete(
      canWrite,
      validate(schemas.remove),
      catchAsync(async (req, res) => {
        await service.remove(req.params.id);
        res.status(httpStatus.NO_CONTENT).send();
      })
    );
}

export default router;
