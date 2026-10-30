import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import passport from 'passport';
import httpStatus from 'http-status';
import config from './config/config';
import morgan from './config/morgan';
import xss from './middlewares/xss';
import { jwtStrategy } from './config/passport';
import { authLimiter } from './middlewares/rateLimiter';
import routes from './routes/v1';
import { errorConverter, errorHandler } from './middlewares/error';
import ApiError from './utils/ApiError';

const app = express();

// Prisma returns BIGINT columns (e.g. user_info.id) as bigint, which JSON.stringify cannot
// serialize, and BLOB/VARBINARY columns as Uint8Array; send them as numbers and base64
app.set('json replacer', (key: string, value: unknown) => {
  if (typeof value === 'bigint') {
    return value <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(value) : value.toString();
  }
  if (value instanceof Uint8Array) {
    return Buffer.from(value).toString('base64');
  }
  // a Buffer has already been turned into { type: 'Buffer', data } by its toJSON
  if (
    value !== null &&
    typeof value === 'object' &&
    (value as { type?: unknown }).type === 'Buffer' &&
    Array.isArray((value as { data?: unknown }).data)
  ) {
    return Buffer.from((value as { data: number[] }).data).toString('base64');
  }
  return value;
});

if (config.env !== 'test') {
  app.use(morgan.successHandler);
  app.use(morgan.errorHandler);
}

// set security HTTP headers
app.use(helmet());

// parse json request body
app.use(express.json());

// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// sanitize request data
app.use(xss());

// gzip compression
app.use(compression());

// enable cors (also answers preflight OPTIONS requests)
app.use(cors());

// jwt authentication
app.use(passport.initialize());
passport.use('jwt', jwtStrategy);

// limit repeated failed requests to auth endpoints
if (config.env === 'production') {
  app.use('/v1/auth', authLimiter);
}

// v1 api routes
app.use('/v1', routes);

// send back a 404 error for any unknown api request
app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
});

// convert error to ApiError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);

export default app;
