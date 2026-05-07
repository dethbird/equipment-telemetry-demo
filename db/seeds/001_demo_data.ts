import type { Knex } from 'knex';

// Fixed UUIDs for deterministic/idempotent seeding
const TENANT_ID = 'a0000000-0000-0000-0000-000000000001';

const ASSET_IDS = [
  'b0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000002',
  'b0000000-0000-0000-0000-000000000003',
];

const DEVICE_IDS = [
  'c0000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000002',
  'c0000000-0000-0000-0000-000000000003',
];

const RULE_IDS = [
  'd0000000-0000-0000-0000-000000000001',
  'd0000000-0000-0000-0000-000000000002',
];

export async function seed(knex: Knex): Promise<void> {
  // Truncate in reverse dependency order to satisfy FK constraints
  await knex('maintenance_work_orders').del();
  await knex('maintenance_rules').del();
  await knex('telemetry_readings').del();
  await knex('devices').del();
  await knex('assets').del();
  await knex('users').del();
  await knex('tenants').del();

  await knex('tenants').insert({
    id: TENANT_ID,
    name: 'Acme Equipment Co.',
    slug: 'acme',
  });

  await knex('assets').insert([
    { id: ASSET_IDS[0], tenant_id: TENANT_ID, name: 'Excavator A1', type: 'excavator' },
    { id: ASSET_IDS[1], tenant_id: TENANT_ID, name: 'Dump Truck B2', type: 'truck' },
    { id: ASSET_IDS[2], tenant_id: TENANT_ID, name: 'Crane C3', type: 'crane' },
  ]);

  await knex('devices').insert([
    { id: DEVICE_IDS[0], tenant_id: TENANT_ID, asset_id: ASSET_IDS[0], serial_number: 'DEV-001' },
    { id: DEVICE_IDS[1], tenant_id: TENANT_ID, asset_id: ASSET_IDS[1], serial_number: 'DEV-002' },
    { id: DEVICE_IDS[2], tenant_id: TENANT_ID, asset_id: ASSET_IDS[2], serial_number: 'DEV-003' },
  ]);

  // Maintenance rules on Excavator A1 — used in worker threshold evaluation
  await knex('maintenance_rules').insert([
    {
      id: RULE_IDS[0],
      tenant_id: TENANT_ID,
      asset_id: ASSET_IDS[0],
      name: 'Oil Change',
      metric: 'hours',
      threshold: 250,
    },
    {
      id: RULE_IDS[1],
      tenant_id: TENANT_ID,
      asset_id: ASSET_IDS[0],
      name: 'Hydraulic Service',
      metric: 'hours',
      threshold: 1000,
    },
  ]);
}
