import { Prisma } from '@prisma/client';

// Columns of user_info that are safe to return from the API (no password, citizen ID or IPs)
export const userSelect = {
  id: true,
  userName: true,
  isAdmin: true,
  isLibrarian: true,
  departID: true,
  posID: true,
  status: true,
  phoneNum1: true,
  phoneNum2: true,
  birthday: true,
  regDate: true,
  lastAction: true,
  isLogin: true
} satisfies Prisma.user_infoSelect;

export type UserRecord = Prisma.user_infoGetPayload<{ select: typeof userSelect }>;
