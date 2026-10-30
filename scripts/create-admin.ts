import Joi from 'joi';
import { user_info_status } from '@prisma/client';
import prisma from '../src/client';
import logger from '../src/config/logger';
import userService from '../src/services/user.service';
import { password } from '../src/validations/custom.validation';

/**
 * Create an approved admin account in kcc_main.user_info.
 *
 * Usage: yarn create-admin <userName> <password> [departID] [posID] [birthday YYYY-MM-DD]
 */
const argsSchema = Joi.object({
  userName: Joi.string().trim().min(2).max(255).required(),
  password: Joi.string().required().custom(password),
  departID: Joi.number().integer().min(0).default(0),
  posID: Joi.number().integer().min(0).default(0),
  birthday: Joi.date().iso().default(new Date('1970-01-01'))
});

const main = async () => {
  const [userName, plainPassword, departID, posID, birthday] = process.argv.slice(2);
  const { value, error } = argsSchema
    .prefs({ errors: { label: 'key' } })
    .validate({ userName, password: plainPassword, departID, posID, birthday });
  if (error) {
    logger.error(`${error.message}`);
    logger.info(
      'Usage: yarn create-admin <userName> <password> [departID] [posID] [birthday YYYY-MM-DD]'
    );
    process.exitCode = 1;
    return;
  }

  const admin = await userService.createUser({
    ...value,
    isAdmin: true,
    isLibrarian: false,
    status: user_info_status.approved
  });
  logger.info(`Created admin "${admin.userName}" with id ${admin.id}`);
};

main()
  .catch((err) => {
    logger.error(err.message ?? err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
