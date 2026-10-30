import { PrismaClient } from '.prisma-science/client';
import config from './config/config';

// Prisma client for the science_db database (generated from prisma/science/schema.prisma)
// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis as unknown as { sciencePrisma?: PrismaClient };

const sciencePrisma = globalForPrisma.sciencePrisma ?? new PrismaClient();

if (config.env === 'development') globalForPrisma.sciencePrisma = sciencePrisma;

export default sciencePrisma;
