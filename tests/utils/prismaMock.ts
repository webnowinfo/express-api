import { jest } from '@jest/globals';
import { Prisma } from '@prisma/client';
import { Prisma as SciencePrisma } from '.prisma-science/client';

// In-memory stand-ins for src/client (kcc_main) and src/scienceClient (science_db), with a mock
// delegate for every model. Use in a test file with:
//   jest.mock('<relative path>/src/client', () => ({ __esModule: true, default: require('<relative path>/tests/utils/prismaMock').prismaMock }));
//   jest.mock('<relative path>/src/scienceClient', () => ({ __esModule: true, default: require('<relative path>/tests/utils/prismaMock').sciencePrismaMock }));
const fn = () => jest.fn<(...args: any[]) => any>();

const delegate = () => ({
  findFirst: fn(),
  findUnique: fn(),
  findMany: fn(),
  count: fn(),
  create: fn(),
  update: fn(),
  delete: fn(),
  deleteMany: fn()
});

export type DelegateMock = ReturnType<typeof delegate>;

const delegatesFor = (modelNames: string[]) =>
  Object.fromEntries(modelNames.map((name) => [name, delegate()])) as Record<string, DelegateMock>;

type ClientMock = Record<string, DelegateMock> & { $transaction: ReturnType<typeof fn> };

export const prismaMock = {
  ...delegatesFor(Prisma.dmmf.datamodel.models.map((model) => model.name)),
  $transaction: fn()
} as unknown as ClientMock;

export const sciencePrismaMock = {
  ...delegatesFor(SciencePrisma.dmmf.datamodel.models.map((model) => model.name)),
  $transaction: fn()
} as unknown as ClientMock;

/** The mock delegate behind a generic CRUD model */
export const delegateFor = (db: 'main' | 'science', model: string): DelegateMock =>
  (db === 'main' ? prismaMock : sciencePrismaMock)[model] as DelegateMock;
