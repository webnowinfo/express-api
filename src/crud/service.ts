import httpStatus from 'http-status';
import ApiError from '../utils/ApiError';
import { ModelMeta } from './modelRegistry';

export interface ListOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortType?: 'asc' | 'desc';
}

export interface ListResult {
  results: unknown[];
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
}

type RecordInput = Record<string, unknown>;

interface PrismaKnownError {
  code: string;
  meta?: { target?: unknown; column_name?: string };
}

const isPrismaKnownError = (error: unknown): error is PrismaKnownError =>
  error instanceof Error &&
  error.name === 'PrismaClientKnownRequestError' &&
  typeof (error as unknown as PrismaKnownError).code === 'string';

// Turn database errors that are the client's fault into 4xx responses
const mapPrismaError = (meta: ModelMeta, error: unknown): never => {
  if (isPrismaKnownError(error)) {
    switch (error.code) {
      case 'P2025':
        throw new ApiError(httpStatus.NOT_FOUND, `${meta.name} not found`);
      case 'P2002':
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          `Duplicate value for unique field ${String(error.meta?.target ?? '')}`.trim()
        );
      case 'P2000':
        throw new ApiError(httpStatus.BAD_REQUEST, 'Value too long for column');
      case 'P2011':
      case 'P2012':
        throw new ApiError(httpStatus.BAD_REQUEST, 'Missing required value');
      case 'P2020':
        throw new ApiError(httpStatus.BAD_REQUEST, 'Value out of range for column');
      default:
        break;
    }
  }
  throw error;
};

/** Generic list/get/create/update/delete for one table */
export const createCrudService = (meta: ModelMeta) => {
  const bytesFields = meta.fields.filter((field) => field.type === 'Bytes').map((f) => f.name);

  const toId = (raw: unknown) => {
    if (meta.idField.type === 'BigInt') return BigInt(raw as string | number);
    if (meta.idField.type === 'String') return String(raw);
    return Number(raw);
  };
  const whereId = (id: unknown) => ({ [meta.idField.name]: toId(id) });

  // Bytes columns travel as base64 strings in JSON
  const toData = (input: RecordInput) => {
    const data: RecordInput = { ...input };
    for (const name of bytesFields) {
      if (typeof data[name] === 'string') data[name] = Buffer.from(data[name] as string, 'base64');
    }
    return data;
  };

  const list = async (filter: RecordInput, options: ListOptions): Promise<ListResult> => {
    const page = options.page ?? 1;
    const limit = options.limit ?? 10;
    const where = toData(filter);
    const [results, totalResults] = await Promise.all([
      meta.delegate().findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [options.sortBy ?? meta.idField.name]: options.sortType ?? 'desc' }
      }),
      meta.delegate().count({ where })
    ]);
    return { results, page, limit, totalPages: Math.ceil(totalResults / limit), totalResults };
  };

  const get = async (id: unknown) => {
    const record = await meta.delegate().findUnique({ where: whereId(id) });
    if (!record) {
      throw new ApiError(httpStatus.NOT_FOUND, `${meta.name} not found`);
    }
    return record;
  };

  const create = (input: RecordInput) =>
    meta
      .delegate()
      .create({ data: toData(input) })
      .catch((error) => mapPrismaError(meta, error));

  const update = (id: unknown, input: RecordInput) =>
    meta
      .delegate()
      .update({ where: whereId(id), data: toData(input) })
      .catch((error) => mapPrismaError(meta, error));

  const remove = async (id: unknown): Promise<void> => {
    await meta
      .delegate()
      .delete({ where: whereId(id) })
      .catch((error) => mapPrismaError(meta, error));
  };

  return { list, get, create, update, remove };
};

export type CrudService = ReturnType<typeof createCrudService>;
