import { describe, test, expect, jest } from '@jest/globals';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import httpStatus from 'http-status';
import { prismaMock } from '../utils/prismaMock';
import app from '../../src/app';
import { accessTokenFor, makeAdmin, makeUser } from '../fixtures/user.fixture';

// HTTP-level tests through the real Express app with Prisma mocked out (no database needed)
jest.mock('../../src/client', () => ({
  __esModule: true,
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  default: require('../utils/prismaMock').prismaMock
}));

describe('POST /v1/auth/login', () => {
  test('returns 200 with the user (numeric id, role, no password) and tokens', async () => {
    prismaMock.user_info.findUnique.mockResolvedValue({
      ...makeUser(),
      password: bcrypt.hashSync('password1', 4)
    });
    prismaMock.user_info.update.mockResolvedValue({});

    const res = await request(app)
      .post('/v1/auth/login')
      .send({ userName: 'hong', password: 'password1' })
      .expect(httpStatus.OK);

    expect(res.body.user).toMatchObject({ id: 1, userName: 'hong', role: 'USER' });
    expect(res.body.user).not.toHaveProperty('password');
    expect(res.body.tokens.access.token).toEqual(expect.any(String));
  });

  test('returns 400 if userName is missing', async () => {
    await request(app)
      .post('/v1/auth/login')
      .send({ password: 'password1' })
      .expect(httpStatus.BAD_REQUEST);
  });
});

describe('POST /v1/auth/register', () => {
  test('creates a pending user and returns 201', async () => {
    prismaMock.user_info.findFirst.mockResolvedValue(null);
    prismaMock.user_info.create.mockResolvedValue(makeUser({ status: 'pending', isLogin: false }));

    const res = await request(app)
      .post('/v1/auth/register')
      .send({
        userName: 'hong',
        password: 'password1',
        departID: 3,
        posID: 2,
        birthday: '1990-01-01'
      })
      .expect(httpStatus.CREATED);

    expect(res.body.user.status).toBe('pending');
    expect(res.body).not.toHaveProperty('tokens');
  });

  test('returns 400 if the password is too weak', async () => {
    await request(app)
      .post('/v1/auth/register')
      .send({ userName: 'hong', password: 'short', departID: 3, posID: 2, birthday: '1990-01-01' })
      .expect(httpStatus.BAD_REQUEST);
  });
});

describe('GET /v1/users', () => {
  test('returns 403 for a regular user', async () => {
    const user = makeUser();
    prismaMock.user_info.findUnique.mockResolvedValue(user);

    await request(app)
      .get('/v1/users')
      .set('Authorization', `Bearer ${accessTokenFor(user)}`)
      .expect(httpStatus.FORBIDDEN);
  });

  test('returns a page of users for an admin', async () => {
    const admin = makeAdmin();
    prismaMock.user_info.findUnique.mockResolvedValue(admin);
    prismaMock.$transaction.mockImplementation((ops: Promise<unknown>[]) => Promise.all(ops));
    prismaMock.user_info.findMany.mockResolvedValue([makeUser(), admin]);
    prismaMock.user_info.count.mockResolvedValue(2);

    const res = await request(app)
      .get('/v1/users?limit=10&page=1&sortBy=userName')
      .set('Authorization', `Bearer ${accessTokenFor(admin)}`)
      .expect(httpStatus.OK);

    expect(res.body).toMatchObject({ page: 1, limit: 10, totalPages: 1, totalResults: 2 });
    expect(res.body.results.map((u: { id: number; role: string }) => [u.id, u.role])).toEqual([
      [1, 'USER'],
      [2, 'ADMIN']
    ]);
  });

  test('returns 400 for an unsupported sortBy column', async () => {
    const admin = makeAdmin();
    prismaMock.user_info.findUnique.mockResolvedValue(admin);

    await request(app)
      .get('/v1/users?sortBy=password')
      .set('Authorization', `Bearer ${accessTokenFor(admin)}`)
      .expect(httpStatus.BAD_REQUEST);
  });
});

describe('PATCH /v1/users/:userId', () => {
  test('lets a user update their own phone number', async () => {
    const user = makeUser({ id: BigInt(5) });
    prismaMock.user_info.findUnique.mockResolvedValue(user);
    prismaMock.user_info.update.mockResolvedValue({ ...user, phoneNum1: '0109999999' });

    const res = await request(app)
      .patch('/v1/users/5')
      .set('Authorization', `Bearer ${accessTokenFor(user)}`)
      .send({ phoneNum1: '0109999999' })
      .expect(httpStatus.OK);

    expect(res.body.phoneNum1).toBe('0109999999');
  });

  test('stops a user from making themselves admin', async () => {
    const user = makeUser({ id: BigInt(5) });
    prismaMock.user_info.findUnique.mockResolvedValue(user);

    const res = await request(app)
      .patch('/v1/users/5')
      .set('Authorization', `Bearer ${accessTokenFor(user)}`)
      .send({ isAdmin: true })
      .expect(httpStatus.FORBIDDEN);

    expect(res.body.message).toBe('Not allowed to update: isAdmin');
    expect(prismaMock.user_info.update).not.toHaveBeenCalled();
  });
});

describe('Unknown routes', () => {
  test('return 404', async () => {
    await request(app).get('/v1/does-not-exist').expect(httpStatus.NOT_FOUND);
  });
});

describe('/v1/users/:userId/permissions', () => {
  const permissionRow = {
    id: 1,
    userID: 5,
    classID: 'public',
    forumPermission: '1,2',
    dataPermission: '',
    systemPermission: '',
    successPermission: '',
    forumPostPermission: false,
    overseasPermission: 'user:NULL,admin:NULL',
    privatePermission: false
  };

  test('lets a user read their own permissions', async () => {
    const user = makeUser({ id: BigInt(5) });
    prismaMock.user_info.findUnique.mockResolvedValue(user);
    prismaMock.user_permission.findFirst.mockResolvedValue(permissionRow);

    const res = await request(app)
      .get('/v1/users/5/permissions')
      .set('Authorization', `Bearer ${accessTokenFor(user)}`)
      .expect(httpStatus.OK);

    expect(res.body.forumPermission).toEqual([1, 2]);
  });

  test('stops a user from granting themselves permissions', async () => {
    const user = makeUser({ id: BigInt(5) });
    prismaMock.user_info.findUnique.mockResolvedValue(user);

    await request(app)
      .put('/v1/users/5/permissions')
      .set('Authorization', `Bearer ${accessTokenFor(user)}`)
      .send({ dataPermission: [1, 2, 3] })
      .expect(httpStatus.FORBIDDEN);

    expect(prismaMock.user_permission.update).not.toHaveBeenCalled();
    expect(prismaMock.user_permission.create).not.toHaveBeenCalled();
  });

  test('lets an admin update a user’s permissions', async () => {
    const admin = makeAdmin();
    prismaMock.user_info.findUnique.mockResolvedValue(admin);
    prismaMock.user_permission.findFirst.mockResolvedValue(permissionRow);
    prismaMock.user_permission.update.mockResolvedValue({ ...permissionRow, dataPermission: '7' });

    const res = await request(app)
      .put('/v1/users/5/permissions')
      .set('Authorization', `Bearer ${accessTokenFor(admin)}`)
      .send({ dataPermission: [7] })
      .expect(httpStatus.OK);

    expect(res.body.dataPermission).toEqual([7]);
  });

  test('rejects non-integer IDs with 400', async () => {
    const admin = makeAdmin();
    prismaMock.user_info.findUnique.mockResolvedValue(admin);

    await request(app)
      .put('/v1/users/5/permissions')
      .set('Authorization', `Bearer ${accessTokenFor(admin)}`)
      .send({ dataPermission: ['abc'] })
      .expect(httpStatus.BAD_REQUEST);
  });
});

describe('Express 5 request handling', () => {
  test('a login request with no body returns 400 (req.body is undefined in Express 5)', async () => {
    await request(app).post('/v1/auth/login').expect(httpStatus.BAD_REQUEST);
  });

  test('CORS preflight requests are answered', async () => {
    const res = await request(app)
      .options('/v1/auth/login')
      .set('Origin', 'http://example.com')
      .set('Access-Control-Request-Method', 'POST')
      .expect(httpStatus.NO_CONTENT);
    expect(res.headers['access-control-allow-origin']).toBe('*');
  });

  test('validated and XSS-cleaned query values reach the service', async () => {
    const admin = makeAdmin();
    prismaMock.user_info.findUnique.mockResolvedValue(admin);
    prismaMock.$transaction.mockImplementation((ops: Promise<unknown>[]) => Promise.all(ops));
    prismaMock.user_info.findMany.mockResolvedValue([]);
    prismaMock.user_info.count.mockResolvedValue(0);

    await request(app)
      .get('/v1/users')
      .query({ userName: '<b>hong', departID: '3', limit: '5' })
      .set('Authorization', `Bearer ${accessTokenFor(admin)}`)
      .expect(httpStatus.OK);

    expect(prismaMock.user_info.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userName: { contains: '&lt;b>hong' }, departID: 3 },
        take: 5
      })
    );
  });
});

describe('GET /v1', () => {
  test('reports that the API is up, without needing a token', async () => {
    const res = await request(app).get('/v1').expect(httpStatus.OK);
    expect(res.body).toEqual({ name: 'forum-science', status: 'ok' });
  });
});
