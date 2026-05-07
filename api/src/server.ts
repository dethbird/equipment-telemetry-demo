import Hapi from '@hapi/hapi';
import { dbPlugin } from './plugins/db';
import { telemetryRoutes } from './routes/telemetry';
import { assetsRoutes } from './routes/assets';
import { maintenanceRulesRoutes } from './routes/maintenance-rules';
import { workOrdersRoutes } from './routes/work-orders';
import { connectEventBus, closeEventBus } from './services/event-bus';

export async function createServer(): Promise<Hapi.Server> {
  const server = Hapi.server({
    host: '0.0.0.0',
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3001,
    routes: {
      cors: { origin: ['*'] },
      validate: {
        failAction: async (_request, _h, err) => {
          throw err;
        },
      },
    },
  });

  await server.register(dbPlugin);
  await server.register([
    telemetryRoutes,
    assetsRoutes,
    maintenanceRulesRoutes,
    workOrdersRoutes,
  ]);

  server.route({
    method: 'GET',
    path: '/health',
    handler: () => ({ status: 'ok' }),
  });

  return server;
}

async function start(): Promise<void> {
  await connectEventBus();

  const server = await createServer();

  server.ext('onPreStop', async () => {
    await closeEventBus();
  });

  await server.start();
  console.log(`API server running at ${server.info.uri}`);
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
