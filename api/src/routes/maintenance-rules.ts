import type { Plugin } from '@hapi/hapi';
import { maintenanceRulePayloadSchema } from '../validation/schemas';
import type { MaintenanceRulePayload } from '../types';

export const maintenanceRulesRoutes: Plugin<void> = {
  name: 'maintenance-rules-routes',
  version: '1.0.0',
  async register(server) {
    server.route({
      method: 'POST',
      path: '/maintenance-rules',
      options: {
        validate: {
          payload: maintenanceRulePayloadSchema,
          failAction: async (_request, _h, err) => {
            throw err;
          },
        },
      },
      handler: async (request, h) => {
        const payload = request.payload as MaintenanceRulePayload;
        const db = request.server.app.db;

        const [rule] = await db('maintenance_rules')
          .insert({
            tenant_id: payload.tenantId,
            asset_id: payload.assetId,
            name: payload.name,
            metric: payload.metric,
            threshold: payload.threshold,
          })
          .returning('*');

        return h.response(rule).code(201);
      },
    });
  },
};
