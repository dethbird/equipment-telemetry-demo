import type { Plugin } from '@hapi/hapi';
import { tenantIdQuerySchema } from '../validation/schemas';

export const workOrdersRoutes: Plugin<void> = {
  name: 'work-orders-routes',
  version: '1.0.0',
  async register(server) {
    server.route({
      method: 'GET',
      path: '/work-orders',
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

        return db('maintenance_work_orders as wo')
          .join('assets as a', 'wo.asset_id', 'a.id')
          .join('maintenance_rules as r', 'wo.rule_id', 'r.id')
          .where('wo.tenant_id', tenantId)
          .orderBy('wo.created_at', 'desc')
          .select(
            'wo.id',
            'wo.status',
            'wo.reason',
            'wo.created_at',
            'a.id as asset_id',
            'a.name as asset_name',
            'a.type as asset_type',
            'r.id as rule_id',
            'r.name as rule_name',
            'r.metric as rule_metric',
            'r.threshold as rule_threshold',
          );
      },
    });
  },
};
