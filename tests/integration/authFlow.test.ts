import { describe, test, expect, jest } from '@jest/globals';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import httpStatus from 'http-status';
import app from '../../src/app';
import { prismaMock } from '../utils/prismaMock';
import { accessTokenFor, makeAdmin, makeUser } from '../fixtures/user.fixture';

jest.mock('../../src/client', () => ({
  __esModule: true,
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  default: require('../utils/prismaMock').prismaMock
}));

const bearer = (user: { id: bigint }) => `Bearer ${accessTokenFor(user)}`;

describe('GET /v1/auth/me', () => {
  test('returns the role, rights and per-table access for a user', async () => {
    const user = makeUser();
    prismaMock.user_info.findUnique.mockResolvedValue(user);
    prismaMock.user_permission.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .get('/v1/auth/me')
      .set('Authorization', bearer(user))
      .expect(httpStatus.OK);

    expect(res.body.user).toMatchObject({ id: 1, role: 'USER' });
    expect(res.body.rights).toEqual([]);
    expect(res.body.resources['main.book_info']).toEqual({ read: true, write: false });
    expect(res.body.resources['main.log_message']).toEqual({ read: false, write: false });
    expect(res.body.resources['science.room_plan']).toEqual({ read: true, write: false });
    expect(res.body.resources).not.toHaveProperty('main.user_info');
    expect(res.body.permissions).toMatchObject({ userId: 1, classID: 'public' });
  });

  test('gives a librarian write access to book tables and an admin full access', async () => {
    const librarian = makeUser({ isLibrarian: 1 });
    prismaMock.user_info.findUnique.mockResolvedValue(librarian);
    prismaMock.user_permission.findFirst.mockResolvedValue(null);
    const lib = await request(app)
      .get('/v1/auth/me')
      .set('Authorization', bearer(librarian))
      .expect(httpStatus.OK);
    expect(lib.body.user.role).toBe('LIBRARIAN');
    expect(lib.body.resources['main.book_info']).toEqual({ read: true, write: true });
    expect(lib.body.resources['main.article_info']).toEqual({ read: true, write: false });

    const admin = makeAdmin();
    prismaMock.user_info.findUnique.mockResolvedValue(admin);
    const adm = await request(app)
      .get('/v1/auth/me')
      .set('Authorization', bearer(admin))
      .expect(httpStatus.OK);
    expect(adm.body.rights).toEqual(['getUsers', 'manageUsers']);
    expect(Object.values(adm.body.resources).every((a: any) => a.read && a.write)).toBe(true);
  });

  test('requires a token', async () => {
    await request(app).get('/v1/auth/me').expect(httpStatus.UNAUTHORIZED);
  });
});

describe('POST /v1/auth/change-password', () => {
  const user = makeUser();
  const withPassword = { ...user, password: bcrypt.hashSync('password1', 4) };

  test('changes the password when the current one is right', async () => {
    prismaMock.user_info.findUnique.mockImplementation(async (args: any) =>
      args.select?.password ? withPassword : user
    );
    prismaMock.user_info.update.mockResolvedValue(user);

    await request(app)
      .post('/v1/auth/change-password')
      .set('Authorization', bearer(user))
      .send({ currentPassword: 'password1', newPassword: 'newpassword2' })
      .expect(httpStatus.NO_CONTENT);

    const { data } = prismaMock.user_info.update.mock.calls[0][0] as { data: any };
    expect(bcrypt.compareSync('newpassword2', data.password)).toBe(true);
    expect(data.pwd_date).toBeInstanceOf(Date);
  });

  test('rejects a wrong current password with 401', async () => {
    prismaMock.user_info.findUnique.mockImplementation(async (args: any) =>
      args.select?.password ? withPassword : user
    );
    await request(app)
      .post('/v1/auth/change-password')
      .set('Authorization', bearer(user))
      .send({ currentPassword: 'wrongpass1', newPassword: 'newpassword2' })
      .expect(httpStatus.UNAUTHORIZED);
    expect(prismaMock.user_info.update).not.toHaveBeenCalled();
  });

  test('rejects reusing the same password or a weak one with 400', async () => {
    prismaMock.user_info.findUnique.mockImplementation(async (args: any) =>
      args.select?.password ? withPassword : user
    );
    await request(app)
      .post('/v1/auth/change-password')
      .set('Authorization', bearer(user))
      .send({ currentPassword: 'password1', newPassword: 'password1' })
      .expect(httpStatus.BAD_REQUEST);
    await request(app)
      .post('/v1/auth/change-password')
      .set('Authorization', bearer(user))
      .send({ currentPassword: 'password1', newPassword: 'short' })
      .expect(httpStatus.BAD_REQUEST);
  });
});

describe('PATCH /v1/users/:userId/role and /status', () => {
  test('an admin can make a user a librarian', async () => {
    const admin = makeAdmin();
    const target = makeUser({ id: BigInt(5) });
    prismaMock.user_info.findUnique.mockImplementation(async (args: any) =>
      args.where.id === admin.id ? admin : target
    );
    prismaMock.user_info.update.mockResolvedValue({ ...target, isLibrarian: 1 });

    const res = await request(app)
      .patch('/v1/users/5/role')
      .set('Authorization', bearer(admin))
      .send({ role: 'LIBRARIAN' })
      .expect(httpStatus.OK);

    expect(res.body.role).toBe('LIBRARIAN');
    expect(prismaMock.user_info.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { isAdmin: false, isLibrarian: 1 } })
    );
  });

  test('a user cannot change their own role or status', async () => {
    const user = makeUser({ id: BigInt(5) });
    prismaMock.user_info.findUnique.mockResolvedValue(user);
    await request(app)
      .patch('/v1/users/5/role')
      .set('Authorization', bearer(user))
      .send({ role: 'ADMIN' })
      .expect(httpStatus.FORBIDDEN);
    await request(app)
      .patch('/v1/users/5/status')
      .set('Authorization', bearer(user))
      .send({ status: 'approved' })
      .expect(httpStatus.FORBIDDEN);
    expect(prismaMock.user_info.update).not.toHaveBeenCalled();
  });

  test('an admin can approve a pending registration', async () => {
    const admin = makeAdmin();
    const pending = makeUser({ id: BigInt(5), status: 'pending', isLogin: false });
    prismaMock.user_info.findUnique.mockImplementation(async (args: any) =>
      args.where.id === admin.id ? admin : pending
    );
    prismaMock.user_info.update.mockResolvedValue({ ...pending, status: 'approved' });

    const res = await request(app)
      .patch('/v1/users/5/status')
      .set('Authorization', bearer(admin))
      .send({ status: 'approved' })
      .expect(httpStatus.OK);
    expect(res.body.status).toBe('approved');
  });

  test('the last active admin cannot be demoted or suspended', async () => {
    const admin = makeAdmin();
    prismaMock.user_info.findUnique.mockResolvedValue(admin);
    prismaMock.user_info.count.mockResolvedValue(0);

    const demote = await request(app)
      .patch(`/v1/users/${admin.id}/role`)
      .set('Authorization', bearer(admin))
      .send({ role: 'USER' })
      .expect(httpStatus.BAD_REQUEST);
    expect(demote.body.message).toBe('Cannot remove the last active admin');

    await request(app)
      .patch(`/v1/users/${admin.id}/status`)
      .set('Authorization', bearer(admin))
      .send({ status: 'suspended' })
      .expect(httpStatus.BAD_REQUEST);
    await request(app)
      .delete(`/v1/users/${admin.id}`)
      .set('Authorization', bearer(admin))
      .expect(httpStatus.BAD_REQUEST);
    expect(prismaMock.user_info.update).not.toHaveBeenCalled();
  });

  test('an admin can step down when another active admin exists', async () => {
    const admin = makeAdmin();
    prismaMock.user_info.findUnique.mockResolvedValue(admin);
    prismaMock.user_info.count.mockResolvedValue(1);
    prismaMock.user_info.update.mockResolvedValue({ ...admin, isAdmin: false });

    await request(app)
      .patch(`/v1/users/${admin.id}/role`)
      .set('Authorization', bearer(admin))
      .send({ role: 'USER' })
      .expect(httpStatus.OK);
    expect(prismaMock.user_info.count).toHaveBeenCalledWith({
      where: { isAdmin: true, status: 'approved', NOT: { id: admin.id } }
    });
  });

  test('rejects an unknown role or status', async () => {
    const admin = makeAdmin();
    prismaMock.user_info.findUnique.mockResolvedValue(admin);
    await request(app)
      .patch('/v1/users/5/role')
      .set('Authorization', bearer(admin))
      .send({ role: 'OWNER' })
      .expect(httpStatus.BAD_REQUEST);
    await request(app)
      .patch('/v1/users/5/status')
      .set('Authorization', bearer(admin))
      .send({ status: 'deleted' })
      .expect(httpStatus.BAD_REQUEST);
  });
});
