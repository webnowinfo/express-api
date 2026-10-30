import { describe, test, expect, jest } from '@jest/globals';
import request from 'supertest';
import httpStatus from 'http-status';
import app from '../../src/app';
import { models } from '../../src/crud/modelRegistry';
import { canAccessResource } from '../../src/config/resources';
import { Role } from '../../src/config/roles';
import { prismaMock, delegateFor } from '../utils/prismaMock';
import { createPayload, changedValue, updateField } from '../utils/sampleData';
import { accessTokenFor, makeAdmin, makeUser } from '../fixtures/user.fixture';

// Every table's endpoints through the real Express app, with both Prisma clients mocked
jest.mock('../../src/client', () => ({
  __esModule: true,
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  default: require('../utils/prismaMock').prismaMock
}));
jest.mock('../../src/scienceClient', () => ({
  __esModule: true,
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  default: require('../utils/prismaMock').sciencePrismaMock
}));

const users = {
  [Role.USER]: makeUser(),
  [Role.LIBRARIAN]: makeUser({ id: BigInt(3), isLibrarian: 1 }),
  [Role.ADMIN]: makeAdmin()
};

const loginAs = (role: Role) => {
  prismaMock.user_info.findUnique.mockResolvedValue(users[role]);
  return `Bearer ${accessTokenFor(users[role])}`;
};

describe.each(models.map((meta) => [`/${meta.db}/${meta.name}`, meta] as const))(
  '%s',
  (path, meta) => {
    const base = `/v1${path}`;
    const delegate = () => delegateFor(meta.db, meta.name);
    const sampleId = meta.idField.type === 'String' ? 'sample-id' : 1;
    const row = { ...createPayload(meta), [meta.idField.name]: sampleId };

    test('requires a token', async () => {
      await request(app).get(base).expect(httpStatus.UNAUTHORIZED);
    });

    test.each([Role.USER, Role.LIBRARIAN])('%s read access follows the policy', async (role) => {
      const auth = loginAs(role);
      delegate().findMany.mockResolvedValue([row]);
      delegate().count.mockResolvedValue(1);
      const expected = canAccessResource(role, meta.db, meta.name, 'read')
        ? httpStatus.OK
        : httpStatus.FORBIDDEN;
      await request(app).get(base).set('Authorization', auth).expect(expected);
    });

    test.each([Role.USER, Role.LIBRARIAN])('%s write access follows the policy', async (role) => {
      const auth = loginAs(role);
      delegate().create.mockResolvedValue(row);
      const expected = canAccessResource(role, meta.db, meta.name, 'write')
        ? httpStatus.CREATED
        : httpStatus.FORBIDDEN;
      await request(app)
        .post(base)
        .set('Authorization', auth)
        .send(createPayload(meta))
        .expect(expected);
      if (expected === httpStatus.FORBIDDEN) expect(delegate().create).not.toHaveBeenCalled();
    });

    test('ADMIN can list, create, read, update and delete', async () => {
      const auth = loginAs(Role.ADMIN);

      delegate().findMany.mockResolvedValue([row]);
      delegate().count.mockResolvedValue(1);
      const list = await request(app)
        .get(`${base}?page=1&limit=5&sortBy=${meta.idField.name}&sortType=asc`)
        .set('Authorization', auth)
        .expect(httpStatus.OK);
      expect(list.body).toMatchObject({ page: 1, limit: 5, totalPages: 1, totalResults: 1 });
      expect(delegate().findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 5, orderBy: { [meta.idField.name]: 'asc' } })
      );

      delegate().create.mockResolvedValue(row);
      await request(app)
        .post(base)
        .set('Authorization', auth)
        .send(createPayload(meta))
        .expect(httpStatus.CREATED);

      delegate().findUnique.mockResolvedValue(row);
      await request(app)
        .get(`${base}/${sampleId}`)
        .set('Authorization', auth)
        .expect(httpStatus.OK);

      const field = updateField(meta);
      delegate().update.mockResolvedValue({ ...row, [field.name]: changedValue(field) });
      await request(app)
        .patch(`${base}/${sampleId}`)
        .set('Authorization', auth)
        .send({ [field.name]: changedValue(field) })
        .expect(httpStatus.OK);
      expect(delegate().update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { [meta.idField.name]: meta.idField.type === 'BigInt' ? BigInt(1) : sampleId }
        })
      );

      delegate().delete.mockResolvedValue(row);
      await request(app)
        .delete(`${base}/${sampleId}`)
        .set('Authorization', auth)
        .expect(httpStatus.NO_CONTENT);
    });

    test('rejects an invalid body with 400', async () => {
      const auth = loginAs(Role.ADMIN);
      await request(app)
        .post(base)
        .set('Authorization', auth)
        .send({ ...createPayload(meta), notAColumn: true })
        .expect(httpStatus.BAD_REQUEST);
      expect(delegate().create).not.toHaveBeenCalled();
    });
  }
);

describe('CRUD response serialization', () => {
  test('BIGINT values become numbers and binary columns become base64', async () => {
    const auth = loginAs(Role.ADMIN);
    prismaMock.session_info.findUnique.mockResolvedValue({
      id: 'abc',
      ip_address: '10.0.0.1',
      timestamp: 5,
      data: new Uint8Array(Buffer.from('hello'))
    });
    const res = await request(app)
      .get('/v1/main/session_info/abc')
      .set('Authorization', auth)
      .expect(httpStatus.OK);
    expect(res.body.data).toBe(Buffer.from('hello').toString('base64'));

    delegateFor('science', 'room_rundoc').findUnique.mockResolvedValue({
      id: BigInt(7),
      depart_id: BigInt(3)
    });
    const rundoc = await request(app)
      .get('/v1/science/room_rundoc/7')
      .set('Authorization', auth)
      .expect(httpStatus.OK);
    expect(rundoc.body).toMatchObject({ id: 7, depart_id: 3 });
  });

  test('a missing row returns 404', async () => {
    const auth = loginAs(Role.ADMIN);
    prismaMock.article_info.findUnique.mockResolvedValue(null);
    const res = await request(app)
      .get('/v1/main/article_info/999')
      .set('Authorization', auth)
      .expect(httpStatus.NOT_FOUND);
    expect(res.body.message).toBe('article_info not found');
  });

  test('unknown tables return 404', async () => {
    await request(app).get('/v1/main/no_such_table').expect(httpStatus.NOT_FOUND);
  });
});
