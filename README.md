# equipment-telemetry-demo

A multi-tenant IoT equipment tracking platform. Devices send telemetry to a hapi.js API, readings are persisted in Postgres, events are published to RabbitMQ, and a worker evaluates maintenance rules and opens work orders asynchronously.

```
IoT Device
  ↓
hapi API  (POST /telemetry — Joi validation)
  ↓
Postgres  (telemetry_readings)
  ↓
RabbitMQ  (queue: telemetry.received)
  ↓
Maintenance Worker
  ↓
Work Order Created  (maintenance_work_orders)
  ↓
React Dashboard  (asset list → detail → telemetry + work orders)
```

---

## Stack

| Layer | Tech |
|---|---|
| API | hapi.js + Joi validation |
| Database | Postgres 16 + Knex.js (migrations + query builder) |
| Message queue | RabbitMQ 3.13 + amqplib |
| Worker | Node.js consumer |
| Frontend | React 18 + TypeScript + Vite + React Router v6 |
| Infrastructure | Docker Compose |

---

## Running locally

### Prerequisites

- Docker + Docker Compose

### Start everything

```bash
docker compose up --build
```

Services:

| Service | URL |
|---|---|
| React dashboard | http://localhost:3000 |
| hapi API | http://localhost:3001 |
| RabbitMQ management | http://localhost:15672 (user: `telemetry` / pass: `telemetry`) |

### Run migrations + seed demo data

The first time (or after `migrate:rollback`), seed the demo tenant, assets, devices, and maintenance rules:

```bash
cd db
npm install
DATABASE_URL=postgres://telemetry:telemetry@localhost:5432/telemetry npm run migrate
DATABASE_URL=postgres://telemetry:telemetry@localhost:5432/telemetry npm run seed
```

---

## API

### POST /telemetry

```bash
curl -X POST http://localhost:3001/telemetry \
  -H 'Content-Type: application/json' \
  -d '{
    "tenantId": "a0000000-0000-0000-0000-000000000001",
    "deviceId": "c0000000-0000-0000-0000-000000000001",
    "hours": 812.5,
    "mileage": 10421,
    "engineTemp": 196,
    "timestamp": "2026-05-07T14:30:00Z"
  }'
```

### GET /assets

```bash
curl "http://localhost:3001/assets?tenantId=a0000000-0000-0000-0000-000000000001"
```

### GET /assets/:id

```bash
curl "http://localhost:3001/assets/b0000000-0000-0000-0000-000000000001?tenantId=a0000000-0000-0000-0000-000000000001"
```

### POST /maintenance-rules

```bash
curl -X POST http://localhost:3001/maintenance-rules \
  -H 'Content-Type: application/json' \
  -d '{
    "tenantId": "a0000000-0000-0000-0000-000000000001",
    "assetId": "b0000000-0000-0000-0000-000000000001",
    "name": "Filter Replacement",
    "metric": "hours",
    "threshold": 500
  }'
```

### GET /work-orders

```bash
curl "http://localhost:3001/work-orders?tenantId=a0000000-0000-0000-0000-000000000001"
```

---

## Tests

```bash
cd api
npm install
npm test
```

Tests use Vitest + hapi's `server.inject()` (no real HTTP). The database and RabbitMQ are mocked — no infrastructure needed to run tests.

---

## Project structure

```
equipment-telemetry-demo/
├── docker-compose.yml
├── .env.example
├── db/
│   ├── knexfile.ts
│   ├── migrations/          # 7 migration files — one per entity
│   └── seeds/
│       └── 001_demo_data.ts # 1 tenant, 3 assets/devices, 2 maintenance rules
├── api/
│   └── src/
│       ├── server.ts
│       ├── plugins/db.ts         # Knex lifecycle plugin
│       ├── routes/               # telemetry, assets, maintenance-rules, work-orders
│       ├── services/event-bus.ts # amqplib publisher
│       ├── validation/schemas.ts # Joi schemas
│       └── test/
│           └── telemetry.test.ts
├── worker/
│   └── src/
│       ├── consumer.ts                        # amqplib subscriber
│       └── handlers/telemetry-received.ts     # rule evaluation
└── frontend/
    └── src/
        ├── api/client.ts
        ├── pages/            # AssetList, AssetDetail
        └── components/       # TelemetryCard, WorkOrderList
```

---

## Data model

```
tenants
  └── assets  ←→  devices (1:1)
        └── telemetry_readings  (via device_id)
        └── maintenance_rules
              └── maintenance_work_orders
```

All entities are scoped by `tenant_id`. Every query filters by tenant to enforce data isolation.

---

## Worker flow

```
consume telemetry.received
  → fetch reading from DB
  → fetch device → asset
  → load maintenance_rules for asset
  → for each rule:
      if reading.hours >= rule.threshold (or mileage)
        and no open work_order exists for (asset, rule)
          → insert maintenance_work_order
  → ack message
```
