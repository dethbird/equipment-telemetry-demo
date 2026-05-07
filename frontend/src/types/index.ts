// Shapes mirror API response bodies exactly.
// Postgres numeric columns arrive as strings through Knex/pg.

export interface Device {
  id: string;
  tenant_id: string;
  asset_id: string;
  serial_number: string;
  created_at: string;
}

export interface Asset {
  id: string;
  tenant_id: string;
  name: string;
  type: string;
  created_at: string;
  device: Device | null;
}

export interface TelemetryReading {
  id: string;
  tenant_id: string;
  device_id: string;
  hours: string;
  mileage: string;
  engine_temp: string;
  timestamp: string;
  created_at: string;
}

// Raw work-order row as returned by GET /assets/{id}
export interface MaintenanceWorkOrder {
  id: string;
  tenant_id: string;
  asset_id: string;
  rule_id: string;
  reason: string;
  status: 'open' | 'closed';
  created_at: string;
}

// Joined row as returned by GET /work-orders
export interface WorkOrderRow {
  id: string;
  status: 'open' | 'closed';
  reason: string;
  created_at: string;
  asset_id: string;
  asset_name: string;
  asset_type: string;
  rule_id: string;
  rule_name: string;
  rule_metric: 'hours' | 'mileage';
  rule_threshold: string;
}

export interface AssetDetail {
  asset: Asset;
  device: Device | null;
  latestTelemetry: TelemetryReading | null;
  workOrders: MaintenanceWorkOrder[];
}
