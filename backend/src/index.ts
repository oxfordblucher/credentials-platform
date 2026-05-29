import { app } from './app.js';
import { db } from './db/index.js';
import { logger } from './utils/logger.js';

const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;

const server = app.listen(port, () => {
  logger.info({ port }, 'Server listening');
});

async function shutdown(signal: string) {
  logger.info({ signal }, 'Graceful shutdown initiated');

  server.close(async (err) => {
    if (err) logger.error({ err }, 'Error closing HTTP server');

    try {
      await db.$client.end();
      logger.info('Database pool closed');
    } catch (e) {
      logger.error({ err: e }, 'Error closing database pool');
    }

    process.exit(err ? 1 : 0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
