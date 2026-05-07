Build this:

# **IoT Equipment Telemetry Demo**

A small **multi-tenant equipment tracking platform** using:

```txt
hapi.js + React + TypeScript + Postgres + RabbitMQ + Docker
```

The goal is to mimic Tenna’s world:

> equipment sends telemetry → API ingests it → message queue triggers maintenance workflows → UI shows asset health.

hapi is a good fit to study because it is enterprise-oriented, plugin-heavy, and has first-class request validation through Joi. The official docs describe hapi as a scalable framework with built-in functionality, and hapi’s validation tutorial specifically highlights Joi-based route validation. ([Hapi][1])

---

## The Demo App

Call it:

```txt
equipment-telemetry-demo
```

### Core entities

```txt
Tenant
User
Asset
Device
TelemetryReading
MaintenanceRule
MaintenanceWorkOrder
```

### Core flow

```txt
Device sends telemetry
  ↓
hapi API validates payload
  ↓
Telemetry saved to Postgres
  ↓
RabbitMQ event published: telemetry.received
  ↓
Worker consumes event
  ↓
Maintenance rules evaluated
  ↓
Work order created if threshold exceeded
  ↓
React dashboard shows asset status
```

RabbitMQ is especially relevant because the job explicitly mentions message queueing architecture. Its work-queue tutorial frames queues as a way to distribute time-consuming tasks among multiple workers, which maps perfectly to telemetry processing and maintenance evaluation. ([RabbitMQ][2])

---

## MVP Features

Build only these:

```md
# Equipment Telemetry Demo MVP

## Backend
- hapi.js API
- Joi request validation
- Postgres persistence
- Tenant-scoped data model
- RabbitMQ publisher
- Worker consumer

## Frontend
- React + TypeScript dashboard
- Asset list
- Asset detail page
- Latest telemetry
- Maintenance status

## DevOps
- Docker Compose:
  - api
  - worker
  - postgres
  - rabbitmq
  - frontend
```

---

## API Endpoints

```md
# API Design

POST /telemetry
- accepts device_id, hours, mileage, engine_temp, timestamp
- validates with Joi
- stores reading
- publishes telemetry.received

GET /assets
- returns tenant-scoped asset list

GET /assets/{id}
- returns asset, device, latest telemetry, open work orders

POST /maintenance-rules
- creates rule like:
  - oil change every 250 hours
  - hydraulic service every 1000 hours

GET /work-orders
- returns tenant-scoped maintenance work orders
```

---

## Example Telemetry Payload

```json
{
  "tenantId": "tenant_acme",
  "deviceId": "device_123",
  "hours": 812.5,
  "mileage": 10421,
  "engineTemp": 196,
  "timestamp": "2026-05-07T14:30:00Z"
}
```

---

## hapi Route Example

```ts
server.route({
  method: "POST",
  path: "/telemetry",
  options: {
    validate: {
      payload: Joi.object({
        tenantId: Joi.string().required(),
        deviceId: Joi.string().required(),
        hours: Joi.number().min(0).required(),
        mileage: Joi.number().min(0).required(),
        engineTemp: Joi.number().required(),
        timestamp: Joi.date().iso().required(),
      }),
    },
  },
  handler: async (request, h) => {
    const payload = request.payload as TelemetryPayload;

    const reading = await telemetryService.createReading(payload);

    await eventBus.publish("telemetry.received", {
      telemetryId: reading.id,
      tenantId: payload.tenantId,
      deviceId: payload.deviceId,
    });

    return h.response(reading).code(201);
  },
});
```

---

## Worker Logic

```ts
async function handleTelemetryReceived(event: TelemetryReceivedEvent) {
  const reading = await telemetryRepo.findById(event.telemetryId);

  const asset = await assetRepo.findByDeviceId(reading.deviceId);

  const rules = await maintenanceRuleRepo.findForAsset(asset.id);

  for (const rule of rules) {
    const exceeded =
      rule.metric === "hours" && reading.hours >= rule.threshold;

    if (exceeded) {
      await workOrderRepo.createIfNotExists({
        tenantId: asset.tenantId,
        assetId: asset.id,
        ruleId: rule.id,
        reason: `${rule.name} threshold exceeded`,
      });
    }
  }
}
```

---

## Why This Is the Right Prep Project

You can say:

> “I built a small IoT telemetry platform to mirror the kinds of systems Tenna works on. It ingests device readings, persists telemetry, publishes events through RabbitMQ, and processes maintenance workflows asynchronously. I also modeled tenant boundaries and asset ownership because multi-tenant SaaS access control is central to the domain.”

That is much stronger than:

> “I learned hapi.”

---

## Interview Talking Points

### hapi vs Express

```md
hapi feels more batteries-included than Express.

Express:
- minimal
- middleware-centric
- you assemble validation/auth/plugins yourself

hapi:
- route config is more structured
- validation is built into route options
- plugin system is a first-class pattern
- feels more enterprise/API-platform oriented
```

### RabbitMQ

```md
I used RabbitMQ because telemetry ingestion should not block on downstream workflows.

The API should acknowledge the reading quickly.
Maintenance checks, alerts, reporting, or integrations can happen async through workers.
```

### Multi-tenant SaaS

```md
I would scope all data by tenant_id.

Every query for assets, devices, telemetry, and work orders needs tenant filtering.
For stronger guarantees, I’d consider Postgres row-level security.
```

### Scaling

```md
The API scales horizontally for ingestion traffic.
Workers scale horizontally based on queue depth.
Postgres handles source-of-truth data.
RabbitMQ smooths spikes from incoming device telemetry.
```

---

## Weekend Build Plan

### Friday night

```md
- Scaffold hapi API
- Add health route
- Add Joi validation
- Add Docker Compose with Postgres + RabbitMQ
```

### Saturday

```md
- Add tenant/assets/devices tables
- Add POST /telemetry
- Publish telemetry.received event
- Add worker consumer
- Create maintenance work orders
```

### Sunday

```md
- React dashboard
- README architecture diagram
- Add tests for telemetry route
- Add interview talking notes
```

---

## README Diagram

Put this in the README:

```txt
IoT Device
  ↓
hapi API
  ↓
Postgres
  ↓
RabbitMQ telemetry.received
  ↓
Maintenance Worker
  ↓
Work Order Created
  ↓
React Dashboard
```

---

## What I’d Prioritize

Do **not** overbuild.

The highest-value pieces are:

```md
1. hapi route validation with Joi
2. RabbitMQ producer/consumer
3. tenant-scoped data model
4. maintenance rule evaluation
5. clear README explaining tradeoffs
```

That is enough to give you a very credible interview story.

[1]: https://hapi.dev/?utm_source=chatgpt.com "hapi.dev - Home"
[2]: https://www.rabbitmq.com/tutorials/tutorial-two-javascript?utm_source=chatgpt.com "RabbitMQ tutorial - Work Queues"
