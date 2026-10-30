import { name, version, description } from '../../package.json';
import config from '../config/config';

const swaggerDef = {
  openapi: '3.0.0',
  info: {
    title: `${name} API`,
    version,
    description,
    license: {
      name: 'MIT'
    }
  },
  servers: [
    {
      url: `http://localhost:${config.port}/v1`
    }
  ]
};

export default swaggerDef;
