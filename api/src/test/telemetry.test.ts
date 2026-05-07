import { describe, it, expect, vi, beforeEach } from 'vitest';
import type Hapi from '@hapi/hapi';
import { createServer } from '../server';

// ─── Module mocks (hoisted before imports resolve) ───────────────────────────

// Prevent any real RabbitMQ connection during tests
vi.mock('../services/event-bus', () => ({
  publish: vi.fn().mockResolvedValue(undefined),
  connectEventBus: vi.fn().mockResolvedValue(undefined),
  closeEventBus: vi.fn().mockResolvedValue(undefined),
}));

// Replace the Knex lifecycle plugin with one that sets server.app.db to null.
// Each test overwrites server.app.db with a tailored mock after server creation.
vi.mock('../plugins/db', () => ({
  dbPlugin: {
    name: 'db',
    version: '1.0.0',
    register(server: Hapi.Server) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (server.app as any).db = null;
    },
  },
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const TENANT_ID = 'a0000000-0000-0000-0000-000000000001';
const DEVICE_ID = 'c0000000-0000-0000-0000-000000000001';

const validPayload = {
  tenantId: TENANT_ID,
  deviceId: DEVICE_ID,
  hours: 812.5,
  mileage: 10421,
  engineTemp: 196,
  timestamp: '2026-05-07T14:30:00Z',
};

const mockDevice = {
  id: DEVICE_ID,
  tenant_id: TENANT_ID,
  asset_id: 'b0000000-0000-0000-0000-000000000001',
  serial_number: 'DEV-001',
  created_at: new Date(),
};

const mockReading = {
  id: 'r0000000-0000-0000-0000-000000000001',
  tenant_id: TENANT_ID,
  device_id: DEVICE_ID,
  hours: '812.50',
  mileage: '10421.00',
  engine_temp: '196.00',
  timestamp: '2026-05-07T14:30:00.000Z',
  created_at: new Date().toISOString(),
};

// ─── Query builder factory ────────────────────────────────────────────────────

/**
 * Returns a minimal Knex-like chainable builder.
 * `firstResult` is what `.first()` resolves to.
 * `insertResult` is what `.returning('*')` resolves to.
 */
function makeQueryBuilder(firstResult: unknown, insertResult: unknown = null) {
  const builder = {
    where: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    first: vi.fn().mockResolvedValue(firstResult),
    returning: vi.fn().mockResolvedValue([insertResult]),
  };
  return builder;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('POST /telemetry', () => {
  let server: Hapi.Server;

  beforeEach(async () => {
    server = await createServer();
  });

  it('returns 201 and the inserted reading for a valid payload', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (server.app as any).db = vi.fn((table: string) => {
      if (table === 'devices') return makeQueryBuilder(mockDevice);
      if (table === 'telemetry_readings') return makeQueryBuilder(null, mockReading);
      return makeQueryBuilder(null);
    });

    const res = await server.inject({
      method: 'POST',
      url: '/telemetry',
      payload: validPayload,
    });

    expect(res.statusCode).toBe(201);
    const body = res.result as typeof mockReading;
    expect(body.device_id).toBe(DEVICE_ID);
    expect(body.tenant_id).toBe(TENANT_ID);
  });

  it('returns 404 when device does not exist for the given tenant', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (server.app as any).db = vi.fn((table: string) => {
      if (table === 'devices') return makeQueryBuilder(undefined); // not found
      return makeQueryBuilder(null);
    });

    const res = await server.inject({
      method: 'POST',
      url: '/telemetry',
      payload: validPayload,
    });

    expect(res.statusCode).toBe(404);
  });

  it('returns 400 when a required field is missing (tenantId)', async () => {
    const { tenantId: _omitted, ...noTenant } = validPayload;

    const res = await server.inject({
      method: 'POST',
      url: '/telemetry',
      payload: noTenant,
    });

    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when hours is negative', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/telemetry',
      payload: { ...validPayload, hours: -1 },
    });

    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when timestamp is not an ISO date', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/telemetry',
      payload: { ...validPayload, timestamp: 'not-a-date' },
    });

    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when engineTemp is not a number', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/telemetry',
      payload: { ...validPayload, engineTemp: 'hot' },
    });

    expect(res.statusCode).toBe(400);
  });
});

describe('GET /health', () => {
  let server: Hapi.Server;

  beforeEach(async () => {
    server = await createServer();
  });

  it('returns 200 with status ok', async () => {
    const res = await server.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect((res.result as { status: string }).status).toBe('ok');
  });
});
