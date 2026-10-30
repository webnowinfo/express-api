import httpStatus from 'http-status';
import ApiError from '../utils/ApiError';
import { NextFunction, Request, Response } from 'express';
import pick from '../utils/pick';
import setRequestField from '../utils/setRequestField';
import Joi from 'joi';

const validate = (schema: object) => (req: Request, res: Response, next: NextFunction) => {
  const validSchema = pick(schema, ['params', 'query', 'body']);
  const obj = pick(req, Object.keys(validSchema));
  // Express 5 leaves req.body undefined when no body is sent; validate it as an empty object
  if ('body' in validSchema && obj.body === undefined) {
    obj.body = {};
  }
  const { value, error } = Joi.compile(validSchema)
    .prefs({ errors: { label: 'key' }, abortEarly: false })
    .validate(obj);
  if (error) {
    const errorMessage = error.details.map((details) => details.message).join(', ');
    return next(new ApiError(httpStatus.BAD_REQUEST, errorMessage));
  }
  for (const field of ['params', 'query', 'body'] as const) {
    if (field in value) setRequestField(req, field, value[field]);
  }
  return next();
};

export default validate;
