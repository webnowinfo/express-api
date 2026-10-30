import { user_permission_classID } from '@prisma/client';
import Joi from 'joi';

const userId = Joi.number().integer().min(1).required();
const idList = Joi.array().items(Joi.number().integer().min(0)).unique();

const getPermissions = {
  params: Joi.object().keys({ userId })
};

const updatePermissions = {
  params: Joi.object().keys({ userId }),
  body: Joi.object()
    .keys({
      classID: Joi.string().valid(...Object.values(user_permission_classID)),
      forumPermission: idList,
      dataPermission: idList,
      systemPermission: idList,
      successPermission: idList,
      forumPostPermission: Joi.boolean(),
      privatePermission: Joi.boolean(),
      overseasPermission: Joi.string().max(255).allow(null)
    })
    .min(1)
};

export default {
  getPermissions,
  updatePermissions
};
