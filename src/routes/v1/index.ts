import express from 'express';
import authRoute from './auth.route';
import userRoute from './user.route';
import crudRoute from '../../crud/router';
import config from '../../config/config';
import { name } from '../../../package.json';

const router = express.Router();

// API root, so opening /v1 shows the API is up instead of a 404
router.get('/', (req, res) => {
  res.send({
    name,
    status: 'ok',
    ...(config.env === 'development' && { docs: '/v1/docs' })
  });
});

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
