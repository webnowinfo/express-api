import httpStatus from 'http-status';
import pick from '../utils/pick';
import ApiError from '../utils/ApiError';
import catchAsync from '../utils/catchAsync';
import { userService } from '../services';
import { QueryOptions, QueryUsersFilter, toUserResponse } from '../services/user.service';
import { getUserRole, hasRights, Role } from '../config/roles';
import { UserRecord } from '../types/user';

// Fields a user may not change on their own account without the manageUsers right
const PRIVILEGED_FIELDS = ['isAdmin', 'isLibrarian', 'status', 'departID', 'posID'];

// Admin-only: change a user's role (stored as the isAdmin / isLibrarian flags)
const setRole = catchAsync(async (req, res) => {
  const role = req.body.role as Role;
  const user = await userService.updateUserById(BigInt(req.params.userId), {
    isAdmin: role === Role.ADMIN,
    isLibrarian: role === Role.LIBRARIAN
  });
  res.send(toUserResponse(user));
});

// Admin-only: approve, suspend or retire an account (only approved accounts can log in)
const setStatus = catchAsync(async (req, res) => {
  const user = await userService.updateUserById(BigInt(req.params.userId), {
    status: req.body.status
  });
  res.send(toUserResponse(user));
});

const createUser = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  res.status(httpStatus.CREATED).send(toUserResponse(user));
});

const getUsers = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['userName', 'departID', 'status']) as QueryUsersFilter;
  const options = pick(req.query, ['sortBy', 'sortType', 'limit', 'page']) as QueryOptions;
  const result = await userService.queryUsers(filter, options);
  res.send({ ...result, results: result.results.map(toUserResponse) });
});

const getUser = catchAsync(async (req, res) => {
  const user = await userService.getUserById(BigInt(req.params.userId));
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  res.send(toUserResponse(user));
});

const updateUser = catchAsync(async (req, res) => {
  const requester = req.user as UserRecord;
  if (!hasRights(getUserRole(requester), ['manageUsers'])) {
    const forbidden = PRIVILEGED_FIELDS.filter((field) => field in req.body);
    if (forbidden.length) {
      throw new ApiError(httpStatus.FORBIDDEN, `Not allowed to update: ${forbidden.join(', ')}`);
    }
  }
  const user = await userService.updateUserById(BigInt(req.params.userId), req.body);
  res.send(toUserResponse(user));
});

const deleteUser = catchAsync(async (req, res) => {
  await userService.deleteUserById(BigInt(req.params.userId));
  res.status(httpStatus.NO_CONTENT).send();
});

export default {
  setRole,
  setStatus,
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser
};
