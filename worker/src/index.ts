import Knex from 'knex';
import { startConsumer } from './consumer';

async function main(): Promise<void> {
  const db = Knex({
    client: 'postgresql',
    connection: process.env.DATABASE_URL || 'postgres://telemetry:telemetry@localhost:5432/telemetry',
  });

  const { connection } = await startConsumer(db);

  const shutdown = async (signal: string): Promise<void> => {
    console.log(`[worker] Received ${signal} — shutting down`);
    await connection.close();
    await db.destroy();
    process.exit(0);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

main().catch((err) => {
  console.error('[worker] Fatal error:', err);
  process.exit(1);
});
