import { user_permission, user_permission_classID } from '@prisma/client';
import httpStatus from 'http-status';
import prisma from '../client';
import ApiError from '../utils/ApiError';
import { formatIdList, parseIdList } from '../utils/idList';

const DEFAULT_OVERSEAS_PERMISSION = 'user:NULL,admin:NULL';

export interface UserPermissions {
  userId: number;
  classID: user_permission_classID;
  forumPermission: number[];
  dataPermission: number[];
  systemPermission: number[];
  successPermission: number[];
  forumPostPermission: boolean;
  privatePermission: boolean;
  overseasPermission: string | null;
}

export type UpdatePermissionsInput = Partial<Omit<UserPermissions, 'userId'>>;

const toPermissions = (userId: number, row: user_permission | null): UserPermissions => ({
  userId,
  classID: row?.classID ?? user_permission_classID.public,
  forumPermission: parseIdList(row?.forumPermission),
  dataPermission: parseIdList(row?.dataPermission),
  systemPermission: parseIdList(row?.systemPermission),
  successPermission: parseIdList(row?.successPermission),
  forumPostPermission: row?.forumPostPermission ?? false,
  privatePermission: row?.privatePermission ?? false,
  overseasPermission: row ? row.overseasPermission : DEFAULT_OVERSEAS_PERMISSION
});

// user_permission.userID is INT (user_info.id is BIGINT) and is not unique; the newest row wins
const findPermissionRow = (userId: number) =>
  prisma.user_permission.findFirst({ where: { userID: userId }, orderBy: { id: 'desc' } });

const assertUserExists = async (userId: bigint) => {
  const user = await prisma.user_info.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
};

const getUserPermissions = async (userId: bigint): Promise<UserPermissions> => {
  await assertUserExists(userId);
  return toPermissions(Number(userId), await findPermissionRow(Number(userId)));
};

const updateUserPermissions = async (
  userId: bigint,
  input: UpdatePermissionsInput
): Promise<UserPermissions> => {
  await assertUserExists(userId);
  const id = Number(userId);
  const data = {
    ...(input.classID !== undefined && { classID: input.classID }),
    ...(input.forumPermission && { forumPermission: formatIdList(input.forumPermission) }),
    ...(input.dataPermission && { dataPermission: formatIdList(input.dataPermission) }),
    ...(input.systemPermission && { systemPermission: formatIdList(input.systemPermission) }),
    ...(input.successPermission && { successPermission: formatIdList(input.successPermission) }),
    ...(input.forumPostPermission !== undefined && {
      forumPostPermission: input.forumPostPermission
    }),
    ...(input.privatePermission !== undefined && { privatePermission: input.privatePermission }),
    ...(input.overseasPermission !== undefined && { overseasPermission: input.overseasPermission })
  };

  const existing = await findPermissionRow(id);
  const row = existing
    ? await prisma.user_permission.update({ where: { id: existing.id }, data })
    : await prisma.user_permission.create({
        // TEXT columns are NOT NULL without defaults, so start from empty lists
        data: {
          userID: id,
          forumPermission: '',
          dataPermission: '',
          systemPermission: '',
          successPermission: '',
          ...data
        }
      });
  return toPermissions(id, row);
};

export default {
  getUserPermissions,
  updateUserPermissions
};
