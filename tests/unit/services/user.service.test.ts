import { describe, beforeEach, test, expect, jest } from '@jest/globals';
import bcrypt from 'bcryptjs';
import httpStatus from 'http-status';
import { Prisma } from '@prisma/client';
import { prismaMock } from '../../utils/prismaMock';
import { userService } from '../../../src/services';
import { makeUser } from '../../fixtures/user.fixture';

jest.mock('../../../src/client', () => ({
  __esModule: true,
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  default: require('../../utils/prismaMock').prismaMock
}));

const newUser = {
  userName: 'kim',
  password: 'password1',
  departID: 3,
  posID: 2,
  birthday: new Date('1995-05-05')
};

describe('userService.createUser', () => {
  test('hashes the password and fills required legacy columns', async () => {
    prismaMock.user_info.findFirst.mockResolvedValue(null);
    prismaMock.user_info.create.mockResolvedValue(makeUser({ userName: 'kim' }));

    await userService.createUser(newUser);

    const { data } = prismaMock.user_info.create.mock.calls[0][0] as { data: any };
    expect(data.password).not.toBe(newUser.password);
    expect(bcrypt.compareSync(newUser.password, data.password)).toBe(true);
    expect(data).toMatchObject({
      status: 'pending',
      isAdmin: false,
      isLibrarian: 0,
      cNum: '',
      favIDs: '',
      followUserIDs: '',
      apply_pdata_ids: ''
    });
    expect(data.regDate).toBeInstanceOf(Date);
  });

  test('rejects a duplicate user name with 400', async () => {
    prismaMock.user_info.findFirst.mockResolvedValue({ id: BigInt(7) });
    await expect(userService.createUser(newUser)).rejects.toMatchObject({
      statusCode: httpStatus.BAD_REQUEST,
      message: 'User name already taken'
    });
    expect(prismaMock.user_info.create).not.toHaveBeenCalled();
  });
});

describe('userService.queryUsers', () => {
  beforeEach(() => {
    prismaMock.$transaction.mockImplementation((ops: Promise<unknown>[]) => Promise.all(ops));
    prismaMock.user_info.findMany.mockResolvedValue([makeUser()]);
    prismaMock.user_info.count.mockResolvedValue(23);
  });

  test('starts at the first page by default', async () => {
    const result = await userService.queryUsers({}, {});
    expect(prismaMock.user_info.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 10, orderBy: { id: 'desc' } })
    );
    expect(result).toMatchObject({ page: 1, limit: 10, totalPages: 3, totalResults: 23 });
  });

  test('skips (page - 1) * limit rows and applies filters', async () => {
    await userService.queryUsers(
      { userName: 'ho', departID: 3, status: 'approved' },
      { page: 3, limit: 5, sortBy: 'userName', sortType: 'asc' }
    );
    expect(prismaMock.user_info.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userName: { contains: 'ho' }, departID: 3, status: 'approved' },
        skip: 10,
        take: 5,
        orderBy: { userName: 'asc' }
      })
    );
  });
});

describe('userService.updateUserById', () => {
  test('hashes a new password and updates pwd_date', async () => {
    prismaMock.user_info.findUnique.mockResolvedValue(makeUser());
    prismaMock.user_info.update.mockResolvedValue(makeUser());

    await userService.updateUserById(BigInt(1), { password: 'newpassword1', isLibrarian: true });

    const { data } = prismaMock.user_info.update.mock.calls[0][0] as { data: any };
    expect(bcrypt.compareSync('newpassword1', data.password)).toBe(true);
    expect(data.pwd_date).toBeInstanceOf(Date);
    expect(data.isLibrarian).toBe(1);
  });

  test('rejects with 404 if the user does not exist', async () => {
    prismaMock.user_info.findUnique.mockResolvedValue(null);
    await expect(userService.updateUserById(BigInt(1), { phoneNum1: '1' })).rejects.toMatchObject({
      statusCode: httpStatus.NOT_FOUND
    });
  });

  test('rejects a user name used by another user with 400', async () => {
    prismaMock.user_info.findUnique.mockResolvedValue(makeUser());
    prismaMock.user_info.findFirst.mockResolvedValue({ id: BigInt(2) });
    await expect(userService.updateUserById(BigInt(1), { userName: 'kim' })).rejects.toMatchObject({
      statusCode: httpStatus.BAD_REQUEST
    });
    expect(prismaMock.user_info.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userName: 'kim', NOT: { id: BigInt(1) } } })
    );
  });
});

describe('userService.deleteUserById', () => {
  test('deletes the user and their permission rows together', async () => {
    prismaMock.user_info.findUnique.mockResolvedValue(makeUser({ id: BigInt(4) }));
    prismaMock.user_permission.deleteMany.mockReturnValue('deletePermissions');
    prismaMock.user_info.delete.mockReturnValue('deleteUser');
    prismaMock.$transaction.mockResolvedValue([]);

    await userService.deleteUserById(BigInt(4));

    expect(prismaMock.user_permission.deleteMany).toHaveBeenCalledWith({ where: { userID: 4 } });
    expect(prismaMock.$transaction).toHaveBeenCalledWith(['deletePermissions', 'deleteUser']);
  });
});

describe('user name uniqueness at the database', () => {
  test('turns a unique-index violation (concurrent insert) into 400', async () => {
    prismaMock.user_info.findFirst.mockResolvedValue(null);
    prismaMock.user_info.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '4.16.2'
      })
    );
    await expect(userService.createUser(newUser)).rejects.toMatchObject({
      statusCode: httpStatus.BAD_REQUEST,
      message: 'User name already taken'
    });
  });
});
