import httpStatus from 'http-status';
import { user_info_status } from '@prisma/client';
import tokenService, { TokenType } from './token.service';
import userService from './user.service';
import ApiError from '../utils/ApiError';
import { verifyPassword } from '../utils/encryption';
import { AuthTokensResponse } from '../types/response';
import { UserRecord } from '../types/user';

const loginUserWithUserNameAndPassword = async (
  userName: string,
  password: string,
  ip?: string
): Promise<UserRecord> => {
  const user = await userService.getUserByUserName(userName);
  const check = user ? await verifyPassword(password, user.password) : null;
  if (!user || !check?.match) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect user name or password');
  }
  if (user.status !== user_info_status.approved) {
    throw new ApiError(httpStatus.FORBIDDEN, `Account is ${user.status}`);
  }
  if (check.needsRehash) {
    // upgrade a legacy MD5/SHA hash to bcrypt now that we know the plain password
    await userService.rehashPassword(user.id, password);
  }
  await userService.updateLoginState(user.id, true, ip);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _password, ...userWithoutPassword } = user;
  return { ...userWithoutPassword, isLogin: true };
};

const getActiveUserFromRefreshToken = async (refreshToken: string): Promise<UserRecord> => {
  try {
    const { userId } = tokenService.verifyToken(refreshToken, TokenType.REFRESH);
    const user = await userService.getUserById(userId);
    if (!user || !user.isLogin || user.status !== user_info_status.approved) {
      throw new Error();
    }
    return user;
  } catch {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
  }
};

const logout = async (refreshToken: string): Promise<void> => {
  const user = await getActiveUserFromRefreshToken(refreshToken);
  await userService.updateLoginState(user.id, false);
};

const refreshAuth = async (refreshToken: string): Promise<AuthTokensResponse> => {
  const user = await getActiveUserFromRefreshToken(refreshToken);
  return tokenService.generateAuthTokens(user);
};

const changePassword = async (
  userId: bigint,
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  const user = await userService.getUserByIdWithPassword(userId);
  if (!user || !(await verifyPassword(currentPassword, user.password)).match) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Current password is incorrect');
  }
  if (currentPassword === newPassword) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'New password must be different');
  }
  await userService.updateUserById(userId, { password: newPassword });
};

export default {
  loginUserWithUserNameAndPassword,
  logout,
  refreshAuth,
  changePassword
};
