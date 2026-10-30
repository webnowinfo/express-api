import prisma from '../client';
import { Strategy as JwtStrategy, ExtractJwt, VerifyCallback } from 'passport-jwt';
import { user_info_status } from '@prisma/client';
import config from './config';
import { TokenType } from '../services/token.service';
import { userSelect } from '../types/user';

const jwtOptions = {
  secretOrKey: config.jwt.secret,
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
};

const jwtVerify: VerifyCallback = async (payload, done) => {
  try {
    if (payload.type !== TokenType.ACCESS) {
      throw new Error('Invalid token type');
    }
    const user = await prisma.user_info.findUnique({
      select: userSelect,
      where: { id: BigInt(payload.sub) }
    });
    // logged-out (isLogin = 0) and non-approved users are rejected even with an unexpired token
    if (!user || !user.isLogin || user.status !== user_info_status.approved) {
      return done(null, false);
    }
    done(null, user);
  } catch (error) {
    done(error, false);
  }
};

export const jwtStrategy = new JwtStrategy(jwtOptions, jwtVerify);
