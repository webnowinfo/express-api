import { Prisma, user_info_status } from '@prisma/client';
import httpStatus from 'http-status';
import prisma from '../client';
import ApiError from '../utils/ApiError';
import { encryptPassword } from '../utils/encryption';
import { userSelect, UserRecord } from '../types/user';
import { getUserRole, Role } from '../config/roles';

export interface CreateUserInput {
  userName: string;
  password: string;
  departID: number;
  posID: number;
  birthday: Date;
  cNum?: string;
  phoneNum1?: string;
  phoneNum2?: string;
  isAdmin?: boolean;
  isLibrarian?: boolean;
  status?: user_info_status;
}

export type UpdateUserInput = Partial<CreateUserInput>;

export interface QueryUsersFilter {
  userName?: string;
  departID?: number;
  status?: user_info_status;
}

export interface QueryOptions {
  limit?: number;
  page?: number;
  sortBy?: 'id' | 'userName' | 'regDate' | 'lastAction';
  sortType?: 'asc' | 'desc';
}

export interface QueryResult<T> {
  results: T[];
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
}

export const toUserResponse = (user: UserRecord): UserRecord & { role: Role } => ({
  ...user,
  role: getUserRole(user)
});

const getUserByUserName = async (userName: string) => {
  return prisma.user_info.findUnique({
    where: { userName },
    select: { ...userSelect, password: true }
  });
};

// A concurrent insert can still hit the unique index after the availability check
const rethrowDuplicateUserName = (error: unknown): never => {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User name already taken');
  }
  throw error;
};

const assertUserNameAvailable = async (userName: string, excludeId?: bigint) => {
  const existing = await prisma.user_info.findFirst({
    where: { userName, ...(excludeId !== undefined && { NOT: { id: excludeId } }) },
    select: { id: true }
  });
  if (existing) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User name already taken');
  }
};

const createUser = async (input: CreateUserInput): Promise<UserRecord> => {
  await assertUserNameAvailable(input.userName);
  const now = new Date();
  // user_info has many NOT NULL columns without defaults; fill them with empty values
  return prisma.user_info
    .create({
      data: {
        userName: input.userName,
        password: await encryptPassword(input.password),
        departID: input.departID,
        posID: input.posID,
        birthday: input.birthday,
        cNum: input.cNum ?? '',
        phoneNum1: input.phoneNum1 ?? '',
        phoneNum2: input.phoneNum2 ?? '',
        isAdmin: input.isAdmin ?? false,
        isLibrarian: input.isLibrarian ? 1 : 0,
        status: input.status ?? user_info_status.pending,
        regDate: now,
        lastAction: now,
        pwd_date: now,
        favIDs: '',
        favForumIDs: '',
        favArticleIDs: '',
        internetFlag: 0,
        iasID: '',
        studyGroup: 0,
        OrganizationGroup: 0,
        followCatIDs: '',
        followUserIDs: '',
        textIDs: '',
        apply_pdata_ids: ''
      },
      select: userSelect
    })
    .catch(rethrowDuplicateUserName);
};

const queryUsers = async (
  filter: QueryUsersFilter,
  options: QueryOptions
): Promise<QueryResult<UserRecord>> => {
  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  const sortBy = options.sortBy ?? 'id';
  const sortType = options.sortType ?? 'desc';
  const where: Prisma.user_infoWhereInput = {
    ...(filter.userName && { userName: { contains: filter.userName } }),
    ...(filter.departID !== undefined && { departID: filter.departID }),
    ...(filter.status && { status: filter.status })
  };
  const [results, totalResults] = await prisma.$transaction([
    prisma.user_info.findMany({
      where,
      select: userSelect,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: sortType }
    }),
    prisma.user_info.count({ where })
  ]);
  return {
    results,
    page,
    limit,
    totalPages: Math.ceil(totalResults / limit),
    totalResults
  };
};

const getUserById = async (id: bigint): Promise<UserRecord | null> => {
  return prisma.user_info.findUnique({ where: { id }, select: userSelect });
};

const getUserByIdWithPassword = async (id: bigint) => {
  return prisma.user_info.findUnique({ where: { id }, select: { ...userSelect, password: true } });
};

const isActiveAdmin = (user: { isAdmin: boolean; status: user_info_status }) =>
  user.isAdmin && user.status === user_info_status.approved;

/**
 * Refuse a change that would leave no approved admin (e.g. demoting, suspending or deleting the
 * last one), since nobody could then approve users or manage roles.
 */
const assertKeepsAnActiveAdmin = async (
  user: UserRecord,
  next: { isAdmin: boolean; status: user_info_status } | null
) => {
  if (!isActiveAdmin(user) || (next && isActiveAdmin(next))) return;
  const otherAdmins = await prisma.user_info.count({
    where: { isAdmin: true, status: user_info_status.approved, NOT: { id: user.id } }
  });
  if (otherAdmins === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot remove the last active admin');
  }
};

const updateUserById = async (id: bigint, input: UpdateUserInput): Promise<UserRecord> => {
  const user = await getUserById(id);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  if (input.isAdmin !== undefined || input.status !== undefined) {
    await assertKeepsAnActiveAdmin(user, {
      isAdmin: input.isAdmin ?? user.isAdmin,
      status: input.status ?? user.status
    });
  }
  if (input.userName && input.userName !== user.userName) {
    await assertUserNameAvailable(input.userName, id);
  }
  const { password, isLibrarian, ...rest } = input;
  const data: Prisma.user_infoUpdateInput = { ...rest };
  if (password !== undefined) {
    data.password = await encryptPassword(password);
    data.pwd_date = new Date();
  }
  if (isLibrarian !== undefined) {
    data.isLibrarian = isLibrarian ? 1 : 0;
  }
  return prisma.user_info
    .update({ where: { id }, data, select: userSelect })
    .catch(rethrowDuplicateUserName);
};

// Re-save a verified password as bcrypt (legacy hash upgrade); not a password change, so pwd_date stays
const rehashPassword = async (id: bigint, password: string): Promise<void> => {
  await prisma.user_info.update({
    where: { id },
    data: { password: await encryptPassword(password) }
  });
};

const updateLoginState = async (id: bigint, isLogin: boolean, userIP?: string): Promise<void> => {
  await prisma.user_info.update({
    where: { id },
    data: { isLogin, lastAction: new Date(), ...(userIP && { userIP: userIP.slice(0, 40) }) }
  });
};

const deleteUserById = async (id: bigint): Promise<UserRecord> => {
  const user = await getUserById(id);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  await assertKeepsAnActiveAdmin(user, null);
  // user_permission.userID is INT while user_info.id is BIGINT; there is no FK, so clean up manually
  await prisma.$transaction([
    prisma.user_permission.deleteMany({ where: { userID: Number(id) } }),
    prisma.user_info.delete({ where: { id } })
  ]);
  return user;
};

export default {
  createUser,
  queryUsers,
  getUserById,
  getUserByIdWithPassword,
  getUserByUserName,
  updateUserById,
  rehashPassword,
  updateLoginState,
  deleteUserById
};
