import type { Plugin } from '@hapi/hapi';
import { tenantIdQuerySchema } from '../validation/schemas';
import type { Asset, Device, TelemetryReading, MaintenanceWorkOrder } from '../types';

export const assetsRoutes: Plugin<void> = {
  name: 'assets-routes',
  version: '1.0.0',
  async register(server) {
    // GET /assets?tenantId=
    server.route({
      method: 'GET',
      path: '/assets',
      options: {
        validate: {
          query: tenantIdQuerySchema,
          failAction: async (_request, _h, err) => {
            throw err;
          },
        },
      },
      handler: async (request) => {
        const { tenantId } = request.query as { tenantId: string };
        const db = request.server.app.db;

        const assets = await db<Asset>('assets')
          .where({ tenant_id: tenantId })
          .orderBy('name');

        const assetIds = assets.map((a) => a.id);
        const devices = assetIds.length
          ? await db<Device>('devices').whereIn('asset_id', assetIds)
          : [];

        const deviceByAsset = new Map(devices.map((d) => [d.asset_id, d]));

        return assets.map((asset) => ({
          ...asset,
          device: deviceByAsset.get(asset.id) ?? null,
        }));
      },
    });

    // GET /assets/{id}?tenantId=
    server.route({
      method: 'GET',
      path: '/assets/{id}',
      options: {
        validate: {
          query: tenantIdQuerySchema,
          failAction: async (_request, _h, err) => {
            throw err;
          },
        },
      },
      handler: async (request, h) => {
        const { id } = request.params as { id: string };
        const { tenantId } = request.query as { tenantId: string };
        const db = request.server.app.db;

        const asset = await db<Asset>('assets')
          .where({ id, tenant_id: tenantId })
          .first();

        if (!asset) {
          return h.response({ error: 'Asset not found' }).code(404);
        }

        const [device, latestTelemetry, workOrders] = await Promise.all([
          db<Device>('devices').where({ asset_id: id }).first(),
          db<TelemetryReading>('telemetry_readings')
            .where({ tenant_id: tenantId })
            .whereIn(
              'device_id',
              db('devices').select('id').where({ asset_id: id }),
            )
            .orderBy('timestamp', 'desc')
            .first(),
          db<MaintenanceWorkOrder>('maintenance_work_orders')
            .where({ asset_id: id, tenant_id: tenantId, status: 'open' })
            .orderBy('created_at', 'desc'),
        ]);

        return { asset, device: device ?? null, latestTelemetry: latestTelemetry ?? null, workOrders };
      },
    });
  },
};
