import { Server } from 'http';
import app from './app';
import prisma from './client';
import sciencePrisma from './scienceClient';
import config from './config/config';
import logger from './config/logger';

let server: Server | undefined;

Promise.all([prisma.$connect(), sciencePrisma.$connect()])
  .then(() => {
    logger.info('Connected to SQL databases (kcc_main, science_db)');
    server = app.listen(config.port, () => {
      logger.info(`Listening to port ${config.port}`);
    });
  })
  .catch((error) => {
    logger.error(`Could not connect to the databases: ${error.message}`);
    process.exit(1);
  });

const disconnect = () => Promise.allSettled([prisma.$disconnect(), sciencePrisma.$disconnect()]);

// Stop accepting requests, let open ones finish, then close the database connections
const shutdown = (exitCode: number) => {
  const finish = () => disconnect().finally(() => process.exit(exitCode));
  if (server) {
    server.close(() => {
      logger.info('Server closed');
      finish();
    });
  } else {
    finish();
  }
};

const unexpectedErrorHandler = (error: unknown) => {
  logger.error(error);
  shutdown(1);
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
  logger.info('SIGTERM received');
  shutdown(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received');
  shutdown(0);
});
