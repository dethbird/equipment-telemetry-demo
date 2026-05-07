import type { Plugin } from '@hapi/hapi';
import Knex from 'knex';

export const dbPlugin: Plugin<void> = {
  name: 'db',
  version: '1.0.0',
  register(server) {
    const db = Knex({
      client: 'postgresql',
      connection: process.env.DATABASE_URL || 'postgres://telemetry:telemetry@localhost:5432/telemetry',
    });

    server.app.db = db;

    server.ext('onPreStop', async () => {
      await db.destroy();
    });
  },
};
