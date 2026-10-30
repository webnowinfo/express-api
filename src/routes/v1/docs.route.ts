import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { buildSpec } from '../../docs/openapiSpec';

const router = express.Router();

const specs = buildSpec();

router.get('/openapi.json', (req, res) => {
  res.json(specs);
});

router.use('/', swaggerUi.serve);
router.get(
  '/',
  swaggerUi.setup(specs, {
    explorer: true,
    // 100+ table tags: start collapsed and allow filtering by tag name
    swaggerOptions: { docExpansion: 'none', filter: true }
  })
);

export default router;
