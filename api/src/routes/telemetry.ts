import type { Plugin } from '@hapi/hapi';
import { telemetryPayloadSchema } from '../validation/schemas';
import { publish } from '../services/event-bus';
import type { TelemetryPayload, TelemetryReceivedEvent, Device } from '../types';

export const telemetryRoutes: Plugin<void> = {
  name: 'telemetry-routes',
  version: '1.0.0',
  async register(server) {
    server.route({
      method: 'POST',
      path: '/telemetry',
      options: {
        validate: {
          payload: telemetryPayloadSchema,
          failAction: async (_request, _h, err) => {
            throw err;
          },
        },
      },
      handler: async (request, h) => {
        const payload = request.payload as TelemetryPayload;
        const db = request.server.app.db;

        const device = await db<Device>('devices')
          .where({ id: payload.deviceId, tenant_id: payload.tenantId })
          .first();

        if (!device) {
          return h.response({ error: 'Device not found for given tenant' }).code(404);
        }

        const [reading] = await db('telemetry_readings')
          .insert({
            tenant_id: payload.tenantId,
            device_id: payload.deviceId,
            hours: payload.hours,
            mileage: payload.mileage,
            engine_temp: payload.engineTemp,
            timestamp: payload.timestamp,
          })
          .returning('*');

        const event: TelemetryReceivedEvent = {
          telemetryId: reading.id,
          tenantId: payload.tenantId,
          deviceId: payload.deviceId,
        };

        await publish(event);

        return h.response(reading).code(201);
      },
    });
  },
};
