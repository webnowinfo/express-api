import { describe, beforeEach, test, expect, jest } from '@jest/globals';
import httpStatus from 'http-status';
import { prismaMock } from '../../utils/prismaMock';
import { permissionService } from '../../../src/services';

jest.mock('../../../src/client', () => ({
  __esModule: true,
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  default: require('../../utils/prismaMock').prismaMock
}));

const row = {
  id: 10,
  userID: 1,
  classID: 'private',
  forumPermission: '1,5,12',
  dataPermission: '[3,4]',
  systemPermission: '',
  successPermission: '7',
  forumPostPermission: true,
  overseasPermission: 'user:NULL,admin:NULL',
  privatePermission: false
};

describe('permissionService.getUserPermissions', () => {
  beforeEach(() => {
    prismaMock.user_info.findUnique.mockResolvedValue({ id: BigInt(1) });
  });

  test('parses both comma-separated and JSON-array ID lists', async () => {
    prismaMock.user_permission.findFirst.mockResolvedValue(row);

    const permissions = await permissionService.getUserPermissions(BigInt(1));

    expect(permissions).toEqual({
      userId: 1,
      classID: 'private',
      forumPermission: [1, 5, 12],
      dataPermission: [3, 4],
      systemPermission: [],
      successPermission: [7],
      forumPostPermission: true,
      privatePermission: false,
      overseasPermission: 'user:NULL,admin:NULL'
    });
    expect(prismaMock.user_permission.findFirst).toHaveBeenCalledWith({
      where: { userID: 1 },
      orderBy: { id: 'desc' }
    });
  });

  test('returns defaults when the user has no permission row', async () => {
    prismaMock.user_permission.findFirst.mockResolvedValue(null);
    const permissions = await permissionService.getUserPermissions(BigInt(1));
    expect(permissions).toMatchObject({
      classID: 'public',
      forumPermission: [],
      forumPostPermission: false,
      overseasPermission: 'user:NULL,admin:NULL'
    });
  });

  test('returns 404 for an unknown user', async () => {
    prismaMock.user_info.findUnique.mockResolvedValue(null);
    await expect(permissionService.getUserPermissions(BigInt(9))).rejects.toMatchObject({
      statusCode: httpStatus.NOT_FOUND
    });
  });
});

describe('permissionService.updateUserPermissions', () => {
  beforeEach(() => {
    prismaMock.user_info.findUnique.mockResolvedValue({ id: BigInt(1) });
  });

  test('updates only the sent fields of the existing row, writing comma-separated lists', async () => {
    prismaMock.user_permission.findFirst.mockResolvedValue(row);
    prismaMock.user_permission.update.mockResolvedValue({ ...row, forumPermission: '2,3' });

    const permissions = await permissionService.updateUserPermissions(BigInt(1), {
      forumPermission: [2, 3],
      privatePermission: true
    });

    expect(prismaMock.user_permission.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: { forumPermission: '2,3', privatePermission: true }
    });
    expect(permissions.forumPermission).toEqual([2, 3]);
  });

  test('creates a row with empty lists when none exists', async () => {
    prismaMock.user_permission.findFirst.mockResolvedValue(null);
    prismaMock.user_permission.create.mockImplementation(async (args: any) => ({
      id: 11,
      classID: 'public',
      forumPostPermission: false,
      privatePermission: false,
      overseasPermission: 'user:NULL,admin:NULL',
      ...args.data
    }));

    const permissions = await permissionService.updateUserPermissions(BigInt(1), {
      dataPermission: [8]
    });

    expect(prismaMock.user_permission.create).toHaveBeenCalledWith({
      data: {
        userID: 1,
        forumPermission: '',
        dataPermission: '8',
        systemPermission: '',
        successPermission: ''
      }
    });
    expect(permissions.dataPermission).toEqual([8]);
  });
});
