import type { Knex } from 'knex';
import type {
  TelemetryReceivedEvent,
  TelemetryReading,
  Device,
  Asset,
  MaintenanceRule,
} from '../types';

export async function handleTelemetryReceived(
  event: TelemetryReceivedEvent,
  db: Knex,
): Promise<void> {
  const reading = await db<TelemetryReading>('telemetry_readings')
    .where({ id: event.telemetryId })
    .first();

  if (!reading) {
    console.warn(`[worker] Telemetry reading not found: ${event.telemetryId}`);
    return;
  }

  const device = await db<Device>('devices')
    .where({ id: reading.device_id })
    .first();

  if (!device) {
    console.warn(`[worker] Device not found for reading: ${reading.device_id}`);
    return;
  }

  const asset = await db<Asset>('assets')
    .where({ id: device.asset_id })
    .first();

  if (!asset) {
    console.warn(`[worker] Asset not found for device: ${device.asset_id}`);
    return;
  }

  const rules = await db<MaintenanceRule>('maintenance_rules').where({
    asset_id: asset.id,
    tenant_id: asset.tenant_id,
  });

  for (const rule of rules) {
    const readingValue = rule.metric === 'hours' ? Number(reading.hours) : Number(reading.mileage);
    const exceeded = readingValue >= Number(rule.threshold);

    if (!exceeded) continue;

    const existing = await db('maintenance_work_orders')
      .where({ asset_id: asset.id, rule_id: rule.id, status: 'open' })
      .first();

    if (existing) continue;

    await db('maintenance_work_orders').insert({
      tenant_id: asset.tenant_id,
      asset_id: asset.id,
      rule_id: rule.id,
      reason: `${rule.name} threshold exceeded (${rule.metric}: ${readingValue} >= ${rule.threshold})`,
      status: 'open',
    });

    console.log(
      `[worker] Work order created — asset: ${asset.name}, rule: ${rule.name}`,
    );
  }
}
