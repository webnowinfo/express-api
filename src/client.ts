import { PrismaClient } from '@prisma/client';
import config from './config/config';

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (config.env === 'development') globalForPrisma.prisma = prisma;

export default prisma;
