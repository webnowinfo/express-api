import express from 'express';
import auth from '../../middlewares/auth';
import validate from '../../middlewares/validate';
import authValidation from '../../validations/auth.validation';
import { authController } from '../../controllers';

const router = express.Router();

router.post('/register', validate(authValidation.register), authController.register);
router.post('/login', validate(authValidation.login), authController.login);
router.post('/logout', validate(authValidation.logout), authController.logout);
router.post(
  '/refresh-tokens',
  validate(authValidation.refreshTokens),
  authController.refreshTokens
);
router.get('/me', auth(), authController.me);
router.post(
  '/change-password',
  auth(),
  validate(authValidation.changePassword),
  authController.changePassword
);

export default router;

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: |
 *     Role-based authentication flow:
 *     1. **Register** (`POST /auth/register`) creates a *pending* account.
 *     2. An **admin approves** it (`PATCH /users/{id}/status` with `approved`) and can set its
 *        **role** (`PATCH /users/{id}/role`: USER, LIBRARIAN or ADMIN).
 *     3. **Login** (`POST /auth/login`) returns an access token (send as `Authorization: Bearer ...`)
 *        and a refresh token (`POST /auth/refresh-tokens`).
 *     4. **`GET /auth/me`** returns the role, named rights, per-table read/write access and
 *        user_permission values, so a client can show only what the user may use.
 *     5. Every endpoint checks the role; table endpoints follow the access policy in
 *        src/config/resources.ts. Suspended or retired accounts and logged-out tokens get 401.
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register as user
 *     description: Creates a pending account. An admin must approve it before the user can log in.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserProfileInput'
 *     responses:
 *       "201":
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       "400":
 *         $ref: '#/components/responses/DuplicateUserName'
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userName
 *               - password
 *             properties:
 *               userName:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *             example:
 *               userName: hong
 *               password: password1
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 tokens:
 *                   $ref: '#/components/schemas/AuthTokens'
 *       "401":
 *         description: Invalid user name or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               code: 401
 *               message: Incorrect user name or password
 *       "403":
 *         description: Account is not approved (pending, suspended or retired)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               code: 403
 *               message: Account is pending
 */

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout
 *     description: Marks the user as logged out, which invalidates all of their access and refresh tokens.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *             example:
 *               refreshToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1ZWJhYzUzNDk1NGI1NDEzOTgwNmMxMTIiLCJpYXQiOjE1ODkyOTg0ODQsImV4cCI6MTU4OTMwMDI4NH0.m1U63blB0MLej_WfB7yC2FTMnCziif9X8yzwDEfJXAg
 *     responses:
 *       "204":
 *         description: No content
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /auth/refresh-tokens:
 *   post:
 *     summary: Refresh auth tokens
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *             example:
 *               refreshToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1ZWJhYzUzNDk1NGI1NDEzOTgwNmMxMTIiLCJpYXQiOjE1ODkyOTg0ODQsImV4cCI6MTU4OTMwMDI4NH0.m1U63blB0MLej_WfB7yC2FTMnCziif9X8yzwDEfJXAg
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthTokens'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Current user, role and access
 *     description: Returns the logged-in user with their role, named rights, read/write access for every table endpoint, and their user_permission values.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 rights:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: [getUsers, manageUsers]
 *                 resources:
 *                   type: object
 *                   description: Keyed by "<db>.<table>"
 *                   additionalProperties:
 *                     type: object
 *                     properties:
 *                       read:
 *                         type: boolean
 *                       write:
 *                         type: boolean
 *                   example:
 *                     main.book_info: { read: true, write: false }
 *                 permissions:
 *                   $ref: '#/components/schemas/UserPermissions'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     summary: Change own password
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 description: At least one number and one letter
 *     responses:
 *       "204":
 *         description: Password changed
 *       "400":
 *         description: New password is invalid or the same as the current one
 *       "401":
 *         description: Not logged in, or the current password is incorrect
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
