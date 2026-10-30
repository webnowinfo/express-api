import { describe, test, expect, jest } from '@jest/globals';
import httpMocks from 'node-mocks-http';
import httpStatus from 'http-status';
import { Prisma } from '@prisma/client';
import { errorConverter } from '../../../src/middlewares/error';
import ApiError from '../../../src/utils/ApiError';

const convert = (error: unknown) => {
  const next = jest.fn();
  errorConverter(error, httpMocks.createRequest(), httpMocks.createResponse(), next);
  return next.mock.calls[0][0] as ApiError;
};

describe('errorConverter', () => {
  test('passes ApiError through unchanged', () => {
    const error = new ApiError(httpStatus.NOT_FOUND, 'missing');
    expect(convert(error)).toBe(error);
  });

  test('keeps the statusCode of a non-ApiError error', () => {
    const error = Object.assign(new Error('bad body'), { statusCode: httpStatus.NOT_FOUND });
    const converted = convert(error);
    expect(converted).toBeInstanceOf(ApiError);
    expect(converted.statusCode).toBe(httpStatus.NOT_FOUND);
    expect(converted.isOperational).toBe(false);
  });

  test('maps known Prisma errors to 400', () => {
    const error = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: '4.16.2'
    });
    expect(convert(error).statusCode).toBe(httpStatus.BAD_REQUEST);
  });

  test('maps unknown errors to 500', () => {
    expect(convert(new Error('boom')).statusCode).toBe(httpStatus.INTERNAL_SERVER_ERROR);
  });
});
