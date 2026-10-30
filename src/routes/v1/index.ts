import express from 'express';
import authRoute from './auth.route';
import userRoute from './user.route';
import crudRoute from '../../crud/router';
import config from '../../config/config';

const router = express.Router();

router.use('/auth', authRoute);
router.use('/users', userRoute);

// API docs (Swagger UI at /v1/docs) only in development. Loaded lazily so production neither
// needs the swagger packages (devDependencies) nor spends startup time building the spec.
/* istanbul ignore next */
if (config.env === 'development') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  router.use('/docs', require('./docs.route').default);
}

// generic CRUD for every table: /main/<table>, /science/<table>
router.use('/', crudRoute);

export default router;
