import httpStatus from 'http-status';
import { user_info_status } from '@prisma/client';
import catchAsync from '../utils/catchAsync';
import { authService, userService, tokenService, permissionService } from '../services';
import { toUserResponse } from '../services/user.service';
import { getUserRole, roleRights } from '../config/roles';
import { canAccessResource } from '../config/resources';
import { models } from '../crud/modelRegistry';
import { UserRecord } from '../types/user';

const register = catchAsync(async (req, res) => {
  // self-registered accounts start as pending and must be approved by an admin before login
  const user = await userService.createUser({
    ...req.body,
    isAdmin: false,
    isLibrarian: false,
    status: user_info_status.pending
  });
  res.status(httpStatus.CREATED).send({ user: toUserResponse(user) });
});

const login = catchAsync(async (req, res) => {
  const { userName, password } = req.body;
  const user = await authService.loginUserWithUserNameAndPassword(userName, password, req.ip);
  const tokens = tokenService.generateAuthTokens(user);
  res.send({ user: toUserResponse(user), tokens });
});

const logout = catchAsync(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken);
  res.send({ ...tokens });
});

// Everything a client needs to build a role-based UI for the logged-in user
const me = catchAsync(async (req, res) => {
  const user = req.user as UserRecord;
  const role = getUserRole(user);
  const resources = Object.fromEntries(
    models.map((meta) => [
      `${meta.db}.${meta.name}`,
      {
        read: canAccessResource(role, meta.db, meta.name, 'read'),
        write: canAccessResource(role, meta.db, meta.name, 'write')
      }
    ])
  );
  res.send({
    user: toUserResponse(user),
    rights: roleRights.get(role) ?? [],
    resources,
    permissions: await permissionService.getUserPermissions(user.id)
  });
});

const changePassword = catchAsync(async (req, res) => {
  const user = req.user as UserRecord;
  await authService.changePassword(user.id, req.body.currentPassword, req.body.newPassword);
  res.status(httpStatus.NO_CONTENT).send();
});

export default {
  register,
  login,
  logout,
  refreshTokens,
  me,
  changePassword
};
