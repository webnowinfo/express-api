import moment from 'moment';
import config from '../../src/config/config';
import tokenService, { TokenType } from '../../src/services/token.service';
import { UserRecord } from '../../src/types/user';

export const makeUser = (overrides: Partial<UserRecord> = {}): UserRecord => ({
  id: BigInt(1),
  userName: 'hong',
  isAdmin: false,
  isLibrarian: 0,
  departID: 3,
  posID: 2,
  status: 'approved',
  phoneNum1: '0101234567',
  phoneNum2: '',
  birthday: new Date('1990-01-01'),
  regDate: new Date('2026-01-01'),
  lastAction: new Date('2026-01-01'),
  isLogin: true,
  ...overrides
});

export const makeAdmin = (overrides: Partial<UserRecord> = {}): UserRecord =>
  makeUser({ id: BigInt(2), userName: 'admin', isAdmin: true, ...overrides });

export const accessTokenFor = (user: { id: bigint }, secret = config.jwt.secret) =>
  tokenService.generateToken(
    user.id,
    moment().add(config.jwt.accessExpirationMinutes, 'minutes'),
    TokenType.ACCESS,
    secret
  );

export const refreshTokenFor = (user: { id: bigint }) =>
  tokenService.generateToken(
    user.id,
    moment().add(config.jwt.refreshExpirationDays, 'days'),
    TokenType.REFRESH
  );
