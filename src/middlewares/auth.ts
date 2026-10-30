import passport from 'passport';
import httpStatus from 'http-status';
import ApiError from '../utils/ApiError';
import { getUserRole, hasRights } from '../config/roles';
import { NextFunction, Request, Response } from 'express';
import { UserRecord } from '../types/user';

const verifyCallback =
  (
    req: Request,
    resolve: (value?: unknown) => void,
    reject: (reason?: unknown) => void,
    requiredRights: string[],
    allowOwner: boolean
  ) =>
  async (err: unknown, user: UserRecord | false, info: unknown) => {
    if (err || info || !user) {
      return reject(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
    }
    req.user = user;

    if (requiredRights.length) {
      // route params are strings while user.id is a bigint, so compare as strings
      const isOwnResource =
        allowOwner &&
        req.params.userId !== undefined &&
        String(req.params.userId) === String(user.id);
      if (!hasRights(getUserRole(user), requiredRights) && !isOwnResource) {
        return reject(new ApiError(httpStatus.FORBIDDEN, 'Forbidden'));
      }
    }

    resolve();
  };

const authenticate =
  (allowOwner: boolean, requiredRights: string[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    return new Promise((resolve, reject) => {
      passport.authenticate(
        'jwt',
        { session: false },
        verifyCallback(req, resolve, reject, requiredRights, allowOwner)
      )(req, res, next);
    })
      .then(() => next())
      .catch((err) => next(err));
  };

/**
 * Require a logged-in user with all of the given rights. Users without the rights are still
 * let through for their own record (req.params.userId === their id).
 */
const auth = (...requiredRights: string[]) => authenticate(true, requiredRights);

/** Like auth(), but without the own-record exception (e.g. nobody may change their own role). */
export const authStrict = (...requiredRights: string[]) => authenticate(false, requiredRights);

export default auth;
