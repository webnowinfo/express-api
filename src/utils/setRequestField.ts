import { Request } from 'express';

type RequestField = 'params' | 'query' | 'body';

/**
 * Replace req.params / req.query / req.body. In Express 5 req.query is a getter with no setter,
 * so plain assignment throws; defining an own property shadows the getter for this request.
 */
const setRequestField = (req: Request, field: RequestField, value: unknown) => {
  Object.defineProperty(req, field, {
    value,
    writable: true,
    enumerable: true,
    configurable: true
  });
};

export default setRequestField;
