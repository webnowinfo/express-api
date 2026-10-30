import { describe, beforeEach, test, expect, jest } from '@jest/globals';
import httpStatus from 'http-status';
import { Prisma } from '@prisma/client';
import { createCrudService } from '../../../src/crud/service';
import { ModelMeta, FieldMeta } from '../../../src/crud/modelRegistry';

const fn = () => jest.fn<(...args: any[]) => any>();
const delegate = {
  findMany: fn(),
  count: fn(),
  findUnique: fn(),
  create: fn(),
  update: fn(),
  delete: fn()
};

const field = (overrides: Partial<FieldMeta>): FieldMeta => ({
  name: 'x',
  type: 'String',
  isId: false,
  isRequired: true,
  hasDefault: false,
  isAutoIncrement: false,
  nativeArgs: [],
  ...overrides
});

const makeMeta = (idType: FieldMeta['type'] = 'Int'): ModelMeta => {
  const idField = field({
    name: 'id',
    type: idType,
    isId: true,
    isAutoIncrement: idType !== 'String'
  });
  return {
    db: 'main',
    name: 'widget',
    idField,
    fields: [idField, field({ name: 'title' }), field({ name: 'blob', type: 'Bytes' })],
    delegate: () => delegate
  };
};

const knownError = (code: string, meta?: Record<string, unknown>) =>
  new Prisma.PrismaClientKnownRequestError('db error', { code, clientVersion: 'test', meta });

describe('generic CRUD service', () => {
  beforeEach(() => {
    delegate.findMany.mockResolvedValue([{ id: 1 }]);
    delegate.count.mockResolvedValue(21);
  });

  test('lists with default paging and newest first', async () => {
    const result = await createCrudService(makeMeta()).list({}, {});
    expect(delegate.findMany).toHaveBeenCalledWith({
      where: {},
      skip: 0,
      take: 10,
      orderBy: { id: 'desc' }
    });
    expect(result).toEqual({
      results: [{ id: 1 }],
      page: 1,
      limit: 10,
      totalPages: 3,
      totalResults: 21
    });
  });

  test('applies filters, paging and sorting, decoding base64 filters', async () => {
    await createCrudService(makeMeta()).list(
      { title: 'a', blob: Buffer.from('hi').toString('base64') },
      { page: 3, limit: 5, sortBy: 'title', sortType: 'asc' }
    );
    expect(delegate.findMany).toHaveBeenCalledWith({
      where: { title: 'a', blob: Buffer.from('hi') },
      skip: 10,
      take: 5,
      orderBy: { title: 'asc' }
    });
    expect(delegate.count).toHaveBeenCalledWith({ where: { title: 'a', blob: Buffer.from('hi') } });
  });

  const idCases: [FieldMeta['type'], number | string, unknown][] = [
    ['Int', 5, 5],
    ['BigInt', 5, BigInt(5)],
    ['String', 'abc', 'abc']
  ];

  test.each(idCases)('looks up %s ids with the right type', async (idType, raw, expected) => {
    delegate.findUnique.mockResolvedValue({ id: expected });
    await createCrudService(makeMeta(idType)).get(raw);
    expect(delegate.findUnique).toHaveBeenCalledWith({ where: { id: expected } });
  });

  test('get returns 404 for a missing row', async () => {
    delegate.findUnique.mockResolvedValue(null);
    await expect(createCrudService(makeMeta()).get(9)).rejects.toMatchObject({
      statusCode: httpStatus.NOT_FOUND,
      message: 'widget not found'
    });
  });

  test('create decodes base64 Bytes columns', async () => {
    delegate.create.mockResolvedValue({ id: 1 });
    await createCrudService(makeMeta()).create({
      title: 't',
      blob: Buffer.from('abc').toString('base64')
    });
    expect(delegate.create).toHaveBeenCalledWith({
      data: { title: 't', blob: Buffer.from('abc') }
    });
  });

  test('update and delete of a missing row return 404', async () => {
    delegate.update.mockRejectedValue(knownError('P2025'));
    delegate.delete.mockRejectedValue(knownError('P2025'));
    const service = createCrudService(makeMeta());
    await expect(service.update(9, { title: 't' })).rejects.toMatchObject({
      statusCode: httpStatus.NOT_FOUND
    });
    await expect(service.remove(9)).rejects.toMatchObject({ statusCode: httpStatus.NOT_FOUND });
  });

  test.each([
    ['P2002', 'Duplicate value for unique field name'],
    ['P2000', 'Value too long for column'],
    ['P2011', 'Missing required value'],
    ['P2020', 'Value out of range for column']
  ])('maps Prisma %s to 400', async (code, message) => {
    delegate.create.mockRejectedValue(knownError(code, { target: 'name' }));
    await expect(createCrudService(makeMeta()).create({ title: 't' })).rejects.toMatchObject({
      statusCode: httpStatus.BAD_REQUEST,
      message
    });
  });

  test('passes other errors through', async () => {
    const error = new Error('connection lost');
    delegate.create.mockRejectedValue(error);
    await expect(createCrudService(makeMeta()).create({ title: 't' })).rejects.toBe(error);
  });
});
