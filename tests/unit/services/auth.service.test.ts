import { describe, test, expect, jest } from '@jest/globals';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import httpStatus from 'http-status';
import { prismaMock } from '../../utils/prismaMock';
import { authService } from '../../../src/services';
import { accessTokenFor, makeUser, refreshTokenFor } from '../../fixtures/user.fixture';

jest.mock('../../../src/client', () => ({
  __esModule: true,
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  default: require('../../utils/prismaMock').prismaMock
}));

const password = 'password1';
const withPassword = (hash: string, overrides = {}) => ({ ...makeUser(overrides), password: hash });

describe('authService.loginUserWithUserNameAndPassword', () => {
  test('returns the user without the password and marks them logged in', async () => {
    prismaMock.user_info.findUnique.mockResolvedValue(withPassword(bcrypt.hashSync(password, 4)));
    prismaMock.user_info.update.mockResolvedValue({});

    const user = await authService.loginUserWithUserNameAndPassword('hong', password, '10.0.0.1');

    expect(user).not.toHaveProperty('password');
    expect(user.isLogin).toBe(true);
    expect(prismaMock.user_info.update).toHaveBeenCalledWith({
      where: { id: BigInt(1) },
      data: expect.objectContaining({ isLogin: true, userIP: '10.0.0.1' })
    });
  });

  test('rejects an unknown user name with 401', async () => {
    prismaMock.user_info.findUnique.mockResolvedValue(null);
    await expect(
      authService.loginUserWithUserNameAndPassword('nobody', password)
    ).rejects.toMatchObject({ statusCode: httpStatus.UNAUTHORIZED });
  });

  test('rejects a wrong password with 401', async () => {
    prismaMock.user_info.findUnique.mockResolvedValue(withPassword(bcrypt.hashSync(password, 4)));
    await expect(
      authService.loginUserWithUserNameAndPassword('hong', 'wrongpass1')
    ).rejects.toMatchObject({ statusCode: httpStatus.UNAUTHORIZED });
  });

  test('rejects a stored value in an unknown format with 401 (not 500)', async () => {
    prismaMock.user_info.findUnique.mockResolvedValue(withPassword('password1'));
    await expect(
      authService.loginUserWithUserNameAndPassword('hong', password)
    ).rejects.toMatchObject({ statusCode: httpStatus.UNAUTHORIZED });
  });

  test.each(['md5', 'sha1', 'sha256', 'sha512'])(
    'accepts a legacy %s hash and re-saves it as bcrypt',
    async (algorithm) => {
      const legacyHash = crypto.createHash(algorithm).update(password).digest('hex');
      prismaMock.user_info.findUnique.mockResolvedValue(withPassword(legacyHash));
      prismaMock.user_info.update.mockResolvedValue({});

      await authService.loginUserWithUserNameAndPassword('hong', password);

      const rehash = prismaMock.user_info.update.mock.calls
        .map((call) => (call[0] as { data: { password?: string } }).data)
        .find((data) => data.password !== undefined);
      expect(rehash).toBeDefined();
      expect(bcrypt.compareSync(password, rehash?.password as string)).toBe(true);
      expect(rehash).not.toHaveProperty('pwd_date');
    }
  );

  test('accepts a PHP $2y$ bcrypt hash without re-saving it', async () => {
    const phpHash = bcrypt.hashSync(password, 4).replace(/^\$2a\$/, '$2y$');
    prismaMock.user_info.findUnique.mockResolvedValue(withPassword(phpHash));
    prismaMock.user_info.update.mockResolvedValue({});

    await authService.loginUserWithUserNameAndPassword('hong', password);

    expect(prismaMock.user_info.update).toHaveBeenCalledTimes(1);
    expect(prismaMock.user_info.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ isLogin: true }) })
    );
  });

  test('rejects a wrong password against a legacy hash without re-saving', async () => {
    const legacyHash = crypto.createHash('md5').update(password).digest('hex');
    prismaMock.user_info.findUnique.mockResolvedValue(withPassword(legacyHash));
    await expect(
      authService.loginUserWithUserNameAndPassword('hong', 'wrongpass1')
    ).rejects.toMatchObject({ statusCode: httpStatus.UNAUTHORIZED });
    expect(prismaMock.user_info.update).not.toHaveBeenCalled();
  });

  test('rejects a pending account with 403', async () => {
    prismaMock.user_info.findUnique.mockResolvedValue(
      withPassword(bcrypt.hashSync(password, 4), { status: 'pending' })
    );
    await expect(
      authService.loginUserWithUserNameAndPassword('hong', password)
    ).rejects.toMatchObject({ statusCode: httpStatus.FORBIDDEN, message: 'Account is pending' });
    expect(prismaMock.user_info.update).not.toHaveBeenCalled();
  });
});

describe('authService.refreshAuth', () => {
  test('returns new tokens for a logged-in user', async () => {
    const user = makeUser();
    prismaMock.user_info.findUnique.mockResolvedValue(user);
    const tokens = await authService.refreshAuth(refreshTokenFor(user));
    expect(tokens.access.token).toEqual(expect.any(String));
    expect(tokens.refresh?.token).toEqual(expect.any(String));
  });

  test('rejects with 401 after logout', async () => {
    const user = makeUser({ isLogin: false });
    prismaMock.user_info.findUnique.mockResolvedValue(user);
    await expect(authService.refreshAuth(refreshTokenFor(user))).rejects.toMatchObject({
      statusCode: httpStatus.UNAUTHORIZED
    });
  });

  test('rejects an access token with 401', async () => {
    const user = makeUser();
    prismaMock.user_info.findUnique.mockResolvedValue(user);
    await expect(authService.refreshAuth(accessTokenFor(user))).rejects.toMatchObject({
      statusCode: httpStatus.UNAUTHORIZED
    });
  });
});

describe('authService.logout', () => {
  test('marks the user logged out', async () => {
    const user = makeUser();
    prismaMock.user_info.findUnique.mockResolvedValue(user);
    prismaMock.user_info.update.mockResolvedValue({});

    await authService.logout(refreshTokenFor(user));

    expect(prismaMock.user_info.update).toHaveBeenCalledWith({
      where: { id: user.id },
      data: expect.objectContaining({ isLogin: false })
    });
  });

  test('rejects an invalid token with 401', async () => {
    await expect(authService.logout('not-a-jwt')).rejects.toMatchObject({
      statusCode: httpStatus.UNAUTHORIZED
    });
  });
});
