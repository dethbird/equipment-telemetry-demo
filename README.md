# equipment-telemetry-demo

![hapi.js](https://img.shields.io/badge/hapi.js-v21-orange?style=flat-square&logo=javascript)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178c6?style=flat-square&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react&logoColor=black)
![Postgres](https://img.shields.io/badge/Postgres-16-336791?style=flat-square&logo=postgresql&logoColor=white)
![RabbitMQ](https://img.shields.io/badge/RabbitMQ-3.13-ff6600?style=flat-square&logo=rabbitmq&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ed?style=flat-square&logo=docker&logoColor=white)
![Knex](https://img.shields.io/badge/Knex.js-migrations-e16426?style=flat-square)
![Vitest](https://img.shields.io/badge/Vitest-tested-6e9f18?style=flat-square&logo=vitest&logoColor=white)

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

There are three ways to run the project:

1. [Docker Compose](#1-docker-compose-recommended) — everything in containers, one command
2. [Local dev servers](#2-local-dev-servers) — run api/worker/frontend separately against local Postgres + RabbitMQ
3. [Tests only](#3-tests-only) — no infrastructure needed

---

### 1. Docker Compose (recommended)

**Prerequisites:** Docker + Docker Compose

```bash
# Clone and enter the repo
git clone <repo-url> equipment-telemetry-demo
cd equipment-telemetry-demo

# Build and start all 5 services
docker compose up --build
```

On first boot the containers start in dependency order:
- `postgres` and `rabbitmq` start first and run health checks
- `api` and `worker` wait until both are healthy before starting
- `frontend` (nginx) starts after `api`

**Seed demo data** (first run only — run while containers are up):

```bash
docker compose exec api sh -c "cd /app && node -e \"
  const knex = require('knex')({ client: 'pg', connection: process.env.DATABASE_URL });
  knex.migrate.latest().then(() => { console.log('migrated'); process.exit(0); });
\""
```

Or run migrations + seed from the host against the exposed Postgres port:

```bash
cd db
npm install
DATABASE_URL=postgres://telemetry:telemetry@localhost:5432/telemetry npm run migrate
DATABASE_URL=postgres://telemetry:telemetry@localhost:5432/telemetry npm run seed
```

**Services once running:**

| Service | URL | Notes |
|---|---|---|
| React dashboard | http://localhost:3000 | nginx proxies API requests to `api:3001` |
| hapi API | http://localhost:3001 | direct access |
| RabbitMQ management UI | http://localhost:15672 | user: `telemetry` / pass: `telemetry` |
| Postgres | `localhost:5432` | user: `telemetry` / pass: `telemetry` / db: `telemetry` |

**Stop everything:**

```bash
docker compose down          # stop containers, keep volumes
docker compose down -v       # stop containers and delete Postgres data
```

---

### 2. Local dev servers

**Prerequisites:** Node.js 20+, a local Postgres instance, a local RabbitMQ instance (or use Docker for just the infrastructure).

**Start only the infrastructure:**

```bash
docker compose up postgres rabbitmq
```

**Copy and configure env:**

```bash
cp .env.example .env
# Edit .env if your local Postgres/RabbitMQ credentials differ
```

**Install dependencies and run migrations + seed:**

```bash
cd db && npm install
DATABASE_URL=postgres://telemetry:telemetry@localhost:5432/telemetry npm run migrate
DATABASE_URL=postgres://telemetry:telemetry@localhost:5432/telemetry npm run seed
cd ..
```

**Start the API (hot-reload):**

```bash
cd api
npm install
cp ../.env.example .env   # or set env vars manually
npm run dev
# Listening at http://localhost:3001
```

**Start the worker (hot-reload, separate terminal):**

```bash
cd worker
npm install
npm run dev
# Waiting for messages on queue: telemetry.received
```

**Start the frontend dev server (separate terminal):**

```bash
cd frontend
npm install
npm run dev
# http://localhost:5173  (Vite proxies /assets /telemetry etc. → localhost:3001)
```

---

### 3. Tests only

No Docker, Postgres, or RabbitMQ required — all external dependencies are mocked.

```bash
cd api
npm install
npm test
```

Expected output:

```
✓ POST /telemetry > returns 201 and the inserted reading for a valid payload
✓ POST /telemetry > returns 404 when device does not exist for the given tenant
✓ POST /telemetry > returns 400 when a required field is missing (tenantId)
✓ POST /telemetry > returns 400 when hours is negative
✓ POST /telemetry > returns 400 when timestamp is not an ISO date
✓ POST /telemetry > returns 400 when engineTemp is not a number
✓ GET /health > returns 200 with status ok

Test Files  1 passed (1)
Tests       7 passed (7)
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
cd api && npm install && npm test          # run once
cd api && npx vitest                       # watch mode
```

Tests use Vitest + hapi's `server.inject()` — no real HTTP server is bound, no ports are opened. The Knex db plugin and the amqplib event bus are replaced with `vi.mock()` stubs so no infrastructure is needed.

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

---

## Screenshots

### Asset list — open work order count badge

The asset list fetches open work orders in parallel and shows a red badge on any asset with outstanding work orders.

![Asset list with open work order badge](img/assets.png)

### Asset detail — telemetry + work orders

Clicking an asset shows the latest telemetry reading (engine hours, mileage, engine temp) and a table of open work orders generated by the maintenance worker. Engine temp above 210 °F turns the card red.

![Asset detail page showing two open work orders](img/asset-detail.png)

### RabbitMQ management — `telemetry.received` queue

The maintenance worker consumes the durable `telemetry.received` queue with manual ack and prefetch 5. 0 ready messages means all telemetry events have been processed.

![RabbitMQ management UI showing the telemetry.received queue](img/queue.png)

---

## Testing work order generation

All commands use the seed tenant and Excavator A1's device. Run them against the API directly on port 3001.

**Seed UUIDs:**

| Entity | ID |
|---|---|
| Tenant (Acme) | `a0000000-0000-0000-0000-000000000001` |
| Excavator A1 (asset) | `b0000000-0000-0000-0000-000000000001` |
| DEV-001 (device on Excavator A1) | `c0000000-0000-0000-0000-000000000001` |
| DEV-002 (device on Dump Truck B2) | `c0000000-0000-0000-0000-000000000002` |
| DEV-003 (device on Crane C3) | `c0000000-0000-0000-0000-000000000003` |

---

### Trigger an Oil Change work order (hours ≥ 250)

```bash
curl -s -X POST http://localhost:3001/telemetry \
  -H 'Content-Type: application/json' \
  -d '{
    "tenantId": "a0000000-0000-0000-0000-000000000001",
    "deviceId": "c0000000-0000-0000-0000-000000000001",
    "hours": 300,
    "mileage": 10500,
    "engineTemp": 196,
    "timestamp": "2026-05-07T14:00:00Z"
  }' | jq
```

The worker evaluates the Oil Change rule (threshold: 250 hrs) and creates a work order. A second POST with the same device won't create a duplicate — the worker checks for an existing open work order first.

---

### Trigger a Hydraulic Service work order (hours ≥ 1000)

```bash
curl -s -X POST http://localhost:3001/telemetry \
  -H 'Content-Type: application/json' \
  -d '{
    "tenantId": "a0000000-0000-0000-0000-000000000001",
    "deviceId": "c0000000-0000-0000-0000-000000000001",
    "hours": 1050,
    "mileage": 15000,
    "engineTemp": 198,
    "timestamp": "2026-05-07T16:00:00Z"
  }' | jq
```

Both Oil Change and Hydraulic Service rules are evaluated. This creates the Hydraulic Service work order (the Oil Change one already exists and won't be duplicated). Excavator A1's detail page will show 2 open work orders.

---

### Trigger the engine temp alert (engineTemp > 210 °F)

```bash
curl -s -X POST http://localhost:3001/telemetry \
  -H 'Content-Type: application/json' \
  -d '{
    "tenantId": "a0000000-0000-0000-0000-000000000001",
    "deviceId": "c0000000-0000-0000-0000-000000000001",
    "hours": 320,
    "mileage": 11000,
    "engineTemp": 215,
    "timestamp": "2026-05-07T15:00:00Z"
  }' | jq
```

The engine temp card on the asset detail page turns red when the latest reading exceeds 210 °F. There is no maintenance rule for engine temp by default — add one with `POST /maintenance-rules` if needed.

---

### Add a custom maintenance rule and trigger it

```bash
# Add a mileage-based Tire Rotation rule at 12,000 mi
curl -s -X POST http://localhost:3001/maintenance-rules \
  -H 'Content-Type: application/json' \
  -d '{
    "tenantId": "a0000000-0000-0000-0000-000000000001",
    "assetId": "b0000000-0000-0000-0000-000000000001",
    "name": "Tire Rotation",
    "metric": "mileage",
    "threshold": 12000
  }' | jq

# Send telemetry that exceeds the new rule
curl -s -X POST http://localhost:3001/telemetry \
  -H 'Content-Type: application/json' \
  -d '{
    "tenantId": "a0000000-0000-0000-0000-000000000001",
    "deviceId": "c0000000-0000-0000-0000-000000000001",
    "hours": 400,
    "mileage": 13000,
    "engineTemp": 197,
    "timestamp": "2026-05-07T17:00:00Z"
  }' | jq
```

---

### Send telemetry for a different asset (Dump Truck B2)

```bash
curl -s -X POST http://localhost:3001/telemetry \
  -H 'Content-Type: application/json' \
  -d '{
    "tenantId": "a0000000-0000-0000-0000-000000000001",
    "deviceId": "c0000000-0000-0000-0000-000000000002",
    "hours": 88,
    "mileage": 4200,
    "engineTemp": 201,
    "timestamp": "2026-05-07T14:00:00Z"
  }' | jq
```

Dump Truck B2 has no maintenance rules in the seed data, so no work orders are created. The telemetry reading is still stored and appears on the asset detail page.

---

### Check all open work orders for the tenant

```bash
curl -s "http://localhost:3001/work-orders?tenantId=a0000000-0000-0000-0000-000000000001" | jq
```

---

### Validation — rejected payloads

```bash
# Missing tenantId → 400
curl -s -X POST http://localhost:3001/telemetry \
  -H 'Content-Type: application/json' \
  -d '{"deviceId":"c0000000-0000-0000-0000-000000000001","hours":100,"mileage":5000,"engineTemp":190,"timestamp":"2026-05-07T14:00:00Z"}' | jq

# Negative hours → 400
curl -s -X POST http://localhost:3001/telemetry \
  -H 'Content-Type: application/json' \
  -d '{"tenantId":"a0000000-0000-0000-0000-000000000001","deviceId":"c0000000-0000-0000-0000-000000000001","hours":-5,"mileage":5000,"engineTemp":190,"timestamp":"2026-05-07T14:00:00Z"}' | jq

# Unknown device → 404
curl -s -X POST http://localhost:3001/telemetry \
  -H 'Content-Type: application/json' \
  -d '{"tenantId":"a0000000-0000-0000-0000-000000000001","deviceId":"00000000-0000-0000-0000-000000000000","hours":100,"mileage":5000,"engineTemp":190,"timestamp":"2026-05-07T14:00:00Z"}' | jq
```
