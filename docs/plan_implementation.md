Let me explore the workspace and research the tech stack to build a solid plan. 

Explore workspace structure

Read [](file:///home/dethbird/code/equipment-telemetry-demo)

Searched for files matching `**/{package.json,tsconfig.json,tsconfig*.json,*.config.js,*.config.ts,.env*,docker*}`, no matches

Read [](file:///home/dethbird/code/equipment-telemetry-demo/docs)

Read [](file:///home/dethbird/code/equipment-telemetry-demo/README.md)

Read [](file:///home/dethbird/code/equipment-telemetry-demo/docs/plan_concept.md)

Analyzing your answers...

Now I have everything I need. Let me write up the full plan. 

Created memory file [](file:///home/dethbird/.config/Code/User/workspaceStorage/d928086437af2061c77bf17127226801/GitHub.copilot-chat/memory-tool/memories/ZTBkOGE0MzItMTZmNi00ZDZmLWE5NTUtMzc4Y2MyNjVjNWI4/plan.md)

Here's the full implementation plan:

---

## Plan: IoT Equipment Telemetry Demo — Full Build

**What:** Scaffold the entire `equipment-telemetry-demo` app from an empty repo — hapi API, maintenance worker, React dashboard, Postgres + RabbitMQ via Docker Compose.

**Decisions locked in:** Knex.js (migrations + query builder), no auth (tenant_id in payload/query), flat top-level directories (no monorepo tooling), amqplib for RabbitMQ, Vite + React Router v6 for frontend.

---

### Directory Layout

```
equipment-telemetry-demo/
├── docker-compose.yml
├── db/
│   ├── knexfile.ts
│   ├── migrations/   (7 files, one per entity)
│   └── seeds/        (demo data: 1 tenant, 3 assets, 2 rules)
├── api/
│   ├── src/
│   │   ├── server.ts
│   │   ├── plugins/db.ts          ← knex lifecycle plugin
│   │   ├── routes/                ← telemetry, assets, maintenance-rules, work-orders
│   │   ├── services/event-bus.ts  ← amqplib publisher
│   │   └── validation/schemas.ts  ← all Joi schemas
│   └── Dockerfile
├── worker/
│   ├── src/
│   │   ├── consumer.ts            ← amqplib subscribe
│   │   └── handlers/telemetry-received.ts  ← rule evaluation logic
│   └── Dockerfile
└── frontend/
    ├── src/
    │   ├── api/client.ts
    │   ├── pages/AssetList.tsx + AssetDetail.tsx
    │   └── components/TelemetryCard.tsx + WorkOrderList.tsx
    └── Dockerfile
```

---

### Database Schema (7 tables via Knex migrations)

| Table | Key columns |
|---|---|
| `tenants` | id, name, slug |
| `users` | id, tenant_id, email |
| `assets` | id, tenant_id, name, type |
| `devices` | id, tenant_id, asset_id, serial_number |
| `telemetry_readings` | id, tenant_id, device_id, hours, mileage, engine_temp, timestamp |
| `maintenance_rules` | id, tenant_id, asset_id, name, metric ('hours'\|'mileage'), threshold |
| `maintenance_work_orders` | id, tenant_id, asset_id, rule_id, reason, status ('open'\|'closed') |

All tenant-scoped tables carry `tenant_id` for filtering. All PKs are UUID via `gen_random_uuid()`.

---

### API Routes (hapi.js + Joi)

| Method | Path | Notes |
|---|---|---|
| `POST` | `/telemetry` | Validates payload, inserts reading, publishes `telemetry.received` |
| `GET` | `/assets` | `?tenantId=` required, returns assets + device |
| `GET` | `/assets/{id}` | Returns asset + device + latest telemetry + open work orders |
| `POST` | `/maintenance-rules` | Creates rule scoped to tenant+asset |
| `GET` | `/work-orders` | `?tenantId=` required, joined with asset + rule |

---

### Worker Flow

1. Consume `telemetry.received` from durable RabbitMQ queue
2. Fetch reading → device → asset
3. Load maintenance rules for asset
4. For each rule where threshold is exceeded: create work order if no open one exists
5. Ack message

---

### Phases

**Phase 1 — Infrastructure** *(all parallel)*
1. `docker-compose.yml` — postgres:16, rabbitmq:3.13-management, api, worker, frontend with health checks
2. Knex migrations for all 7 tables
3. Seed: 1 tenant (acme), 3 assets w/ devices, 2 maintenance rules at 250hr / 1000hr

**Phase 2 — API** *(depends on Phase 1)*
4. `api/` scaffolding — package.json, tsconfig, hapi server, knex plugin
5. Joi schemas, event-bus publisher, all 5 route files
6. `api/Dockerfile`

**Phase 3 — Worker** *(parallel with Phase 2)*
7. `worker/` scaffolding — consumer, telemetry-received handler, Dockerfile

**Phase 4 — Frontend** *(parallel with Phases 2 & 3)*
8. Vite + React + TypeScript + React Router v6
9. Typed API client + AssetList + AssetDetail + sub-components
10. `frontend/Dockerfile` (nginx)

**Phase 5 — Polish** *(depends on Phase 2)*
11. Vitest tests for `POST /telemetry` — valid payload, Joi rejection, missing fields
12. README.md updated with ASCII architecture diagram + `docker compose up` instructions
13. `.env.example`

---

### Verification

1. `docker compose up --build` — all 5 containers reach healthy
2. `POST /telemetry` with example payload → 201, row in DB
3. RabbitMQ management UI (`:15672`) shows message consumed
4. `GET /work-orders` returns a work order when reading hours ≥ rule threshold
5. `GET /assets` + `GET /assets/:id` return tenant-scoped data only
6. Frontend at `:3000` — asset list loads, detail page shows telemetry + work orders
7. `npm test` in `api/` — all telemetry route tests pass

---

**Scope boundaries:** No login/JWT, no user management routes, no WebSocket live updates, no CI config. Just the core telemetry flow end-to-end.

Ready to hand off to implementation? Or any adjustments to scope, structure, or tech choices?