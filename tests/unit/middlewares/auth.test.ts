import { describe, beforeAll, test, expect, jest } from '@jest/globals';
import httpMocks from 'node-mocks-http';
import httpStatus from 'http-status';
import passport from 'passport';
import { prismaMock } from '../../utils/prismaMock';
import auth from '../../../src/middlewares/auth';
import { jwtStrategy } from '../../../src/config/passport';
import ApiError from '../../../src/utils/ApiError';
import { accessTokenFor, makeAdmin, makeUser, refreshTokenFor } from '../../fixtures/user.fixture';

jest.mock('../../../src/client', () => ({
  __esModule: true,
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  default: require('../../utils/prismaMock').prismaMock
}));

const run = async (
  rights: string[],
  headers: Record<string, string>,
  params: Record<string, string> = {}
) => {
  const req = httpMocks.createRequest({ headers, params });
  const next = jest.fn();
  await auth(...rights)(req, httpMocks.createResponse(), next);
  return { req, next };
};

const expectError = (next: ReturnType<typeof jest.fn>, statusCode: number) => {
  expect(next).toHaveBeenCalledWith(expect.any(ApiError));
  expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode }));
};

describe('Auth middleware', () => {
  beforeAll(() => {
    passport.use('jwt', jwtStrategy);
  });

  test('calls next with no error and sets req.user for a valid access token', async () => {
    const user = makeUser();
    prismaMock.user_info.findUnique.mockResolvedValue(user);

    const { req, next } = await run([], { Authorization: `Bearer ${accessTokenFor(user)}` });

    expect(next).toHaveBeenCalledWith();
    expect(req.user).toEqual(user);
    expect(prismaMock.user_info.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: user.id } })
    );
  });

  test('returns 401 if no token is sent', async () => {
    const { next } = await run([], {});
    expectError(next, httpStatus.UNAUTHORIZED);
  });

  test('returns 401 if a refresh token is used as an access token', async () => {
    const user = makeUser();
    prismaMock.user_info.findUnique.mockResolvedValue(user);
    const { next } = await run([], { Authorization: `Bearer ${refreshTokenFor(user)}` });
    expectError(next, httpStatus.UNAUTHORIZED);
  });

  test('returns 401 if the token is signed with another secret', async () => {
    const user = makeUser();
    prismaMock.user_info.findUnique.mockResolvedValue(user);
    const { next } = await run([], {
      Authorization: `Bearer ${accessTokenFor(user, 'wrong-secret')}`
    });
    expectError(next, httpStatus.UNAUTHORIZED);
  });

  test('returns 401 if the user no longer exists', async () => {
    prismaMock.user_info.findUnique.mockResolvedValue(null);
    const { next } = await run([], { Authorization: `Bearer ${accessTokenFor(makeUser())}` });
    expectError(next, httpStatus.UNAUTHORIZED);
  });

  test('returns 401 if the user has logged out', async () => {
    const user = makeUser({ isLogin: false });
    prismaMock.user_info.findUnique.mockResolvedValue(user);
    const { next } = await run([], { Authorization: `Bearer ${accessTokenFor(user)}` });
    expectError(next, httpStatus.UNAUTHORIZED);
  });

  test('returns 401 if the account is not approved', async () => {
    const user = makeUser({ status: 'suspended' });
    prismaMock.user_info.findUnique.mockResolvedValue(user);
    const { next } = await run([], { Authorization: `Bearer ${accessTokenFor(user)}` });
    expectError(next, httpStatus.UNAUTHORIZED);
  });

  test('returns 403 if the user lacks the rights and the resource is not theirs', async () => {
    const user = makeUser();
    prismaMock.user_info.findUnique.mockResolvedValue(user);
    const { next } = await run(
      ['getUsers'],
      { Authorization: `Bearer ${accessTokenFor(user)}` },
      { userId: '99' }
    );
    expectError(next, httpStatus.FORBIDDEN);
  });

  test('allows a user without rights to access their own resource (string route param)', async () => {
    const user = makeUser({ id: BigInt(5) });
    prismaMock.user_info.findUnique.mockResolvedValue(user);
    const { next } = await run(
      ['getUsers'],
      { Authorization: `Bearer ${accessTokenFor(user)}` },
      { userId: '5' }
    );
    expect(next).toHaveBeenCalledWith();
  });

  test('allows an admin to access any resource', async () => {
    const admin = makeAdmin();
    prismaMock.user_info.findUnique.mockResolvedValue(admin);
    const { next } = await run(
      ['getUsers', 'manageUsers'],
      { Authorization: `Bearer ${accessTokenFor(admin)}` },
      { userId: '99' }
    );
    expect(next).toHaveBeenCalledWith();
  });
});
