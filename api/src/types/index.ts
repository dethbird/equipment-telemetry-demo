import type { Knex } from 'knex';

// ─── DB row shapes ────────────────────────────────────────────────────────────

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  created_at: Date;
}

export interface Asset {
  id: string;
  tenant_id: string;
  name: string;
  type: string;
  created_at: Date;
}

export interface Device {
  id: string;
  tenant_id: string;
  asset_id: string;
  serial_number: string;
  created_at: Date;
}

export interface TelemetryReading {
  id: string;
  tenant_id: string;
  device_id: string;
  hours: number;
  mileage: number;
  engine_temp: number;
  timestamp: Date;
  created_at: Date;
}

export interface MaintenanceRule {
  id: string;
  tenant_id: string;
  asset_id: string;
  name: string;
  metric: 'hours' | 'mileage';
  threshold: number;
  created_at: Date;
}

export interface MaintenanceWorkOrder {
  id: string;
  tenant_id: string;
  asset_id: string;
  rule_id: string;
  reason: string;
  status: 'open' | 'closed';
  created_at: Date;
}

// ─── Request/event payloads ───────────────────────────────────────────────────

export interface TelemetryPayload {
  tenantId: string;
  deviceId: string;
  hours: number;
  mileage: number;
  engineTemp: number;
  timestamp: string;
}

export interface TelemetryReceivedEvent {
  telemetryId: string;
  tenantId: string;
  deviceId: string;
}

export interface MaintenanceRulePayload {
  tenantId: string;
  assetId: string;
  name: string;
  metric: 'hours' | 'mileage';
  threshold: number;
}

// ─── hapi server decoration ───────────────────────────────────────────────────

declare module '@hapi/hapi' {
  interface ServerApplicationState {
    db: Knex;
  }
}
