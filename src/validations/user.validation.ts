import { user_info_status } from '@prisma/client';
import Joi from 'joi';
import { password } from './custom.validation';
import { roles } from '../config/roles';

// Fields a user can set on their own profile (also used by /auth/register)
export const profileFields = {
  userName: Joi.string().trim().min(2).max(255),
  password: Joi.string().custom(password),
  departID: Joi.number().integer().min(0),
  posID: Joi.number().integer().min(0),
  birthday: Joi.date().iso(),
  cNum: Joi.string().max(20).allow(''),
  phoneNum1: Joi.string().max(12).allow(''),
  phoneNum2: Joi.string().max(12).allow('')
};

// Fields only users with the manageUsers right may set
export const privilegedFields = {
  isAdmin: Joi.boolean(),
  isLibrarian: Joi.boolean(),
  status: Joi.string().valid(...Object.values(user_info_status))
};

const userId = Joi.number().integer().min(1).required();

const createUser = {
  body: Joi.object().keys({
    ...profileFields,
    ...privilegedFields,
    userName: profileFields.userName.required(),
    password: profileFields.password.required(),
    departID: profileFields.departID.required(),
    posID: profileFields.posID.required(),
    birthday: profileFields.birthday.required()
  })
};

const getUsers = {
  query: Joi.object().keys({
    userName: Joi.string(),
    departID: Joi.number().integer(),
    status: Joi.string().valid(...Object.values(user_info_status)),
    sortBy: Joi.string().valid('id', 'userName', 'regDate', 'lastAction'),
    sortType: Joi.string().valid('asc', 'desc'),
    limit: Joi.number().integer().min(1).max(100),
    page: Joi.number().integer().min(1)
  })
};

const getUser = {
  params: Joi.object().keys({ userId })
};

const updateUser = {
  params: Joi.object().keys({ userId }),
  body: Joi.object()
    .keys({ ...profileFields, ...privilegedFields })
    .min(1)
};

const deleteUser = {
  params: Joi.object().keys({ userId })
};

const setRole = {
  params: Joi.object().keys({ userId }),
  body: Joi.object().keys({
    role: Joi.string()
      .valid(...roles)
      .required()
  })
};

const setStatus = {
  params: Joi.object().keys({ userId }),
  body: Joi.object().keys({
    status: privilegedFields.status.required()
  })
};

export default {
  setRole,
  setStatus,
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser
};
