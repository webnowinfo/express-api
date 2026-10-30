import Joi from 'joi';
import { profileFields } from './user.validation';

const register = {
  body: Joi.object().keys({
    ...profileFields,
    userName: profileFields.userName.required(),
    password: profileFields.password.required(),
    departID: profileFields.departID.required(),
    posID: profileFields.posID.required(),
    birthday: profileFields.birthday.required()
  })
};

const login = {
  body: Joi.object().keys({
    userName: Joi.string().required(),
    password: Joi.string().required()
  })
};

const logout = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required()
  })
};

const refreshTokens = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required()
  })
};

const changePassword = {
  body: Joi.object().keys({
    currentPassword: Joi.string().required(),
    newPassword: profileFields.password.required()
  })
};

export default {
  register,
  login,
  logout,
  refreshTokens,
  changePassword
};
