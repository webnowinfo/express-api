import jwt from 'jsonwebtoken';
import moment, { Moment } from 'moment';
import config from '../config/config';
import { AuthTokensResponse } from '../types/response';

// Tokens are stateless JWTs; there is no token table in kcc_main.
// Logout is enforced through user_info.isLogin (checked on every authenticated request and refresh).
export const TokenType = {
  ACCESS: 'ACCESS',
  REFRESH: 'REFRESH'
} as const;

export type TokenType = typeof TokenType[keyof typeof TokenType];

const generateToken = (
  userId: bigint | number,
  expires: Moment,
  type: TokenType,
  secret = config.jwt.secret
): string => {
  const payload = {
    sub: String(userId),
    iat: moment().unix(),
    exp: expires.unix(),
    type
  };
  return jwt.sign(payload, secret);
};

const verifyToken = (token: string, type: TokenType): { userId: bigint } => {
  const payload = jwt.verify(token, config.jwt.secret) as jwt.JwtPayload;
  if (payload.type !== type || !payload.sub) {
    throw new Error('Invalid token type');
  }
  return { userId: BigInt(payload.sub) };
};

const generateAuthTokens = (user: { id: bigint | number }): AuthTokensResponse => {
  const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
  const accessToken = generateToken(user.id, accessTokenExpires, TokenType.ACCESS);

  const refreshTokenExpires = moment().add(config.jwt.refreshExpirationDays, 'days');
  const refreshToken = generateToken(user.id, refreshTokenExpires, TokenType.REFRESH);

  return {
    access: {
      token: accessToken,
      expires: accessTokenExpires.toDate()
    },
    refresh: {
      token: refreshToken,
      expires: refreshTokenExpires.toDate()
    }
  };
};

export default {
  generateToken,
  verifyToken,
  generateAuthTokens
};
