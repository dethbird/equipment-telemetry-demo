import amqplib, { type Connection, type Channel } from 'amqplib';
import type { Knex } from 'knex';
import { handleTelemetryReceived } from './handlers/telemetry-received';
import type { TelemetryReceivedEvent } from './types';

const QUEUE = 'telemetry.received';
const PREFETCH = 5;

export async function startConsumer(db: Knex): Promise<{ connection: Connection; channel: Channel }> {
  const url = process.env.RABBITMQ_URL || 'amqp://telemetry:telemetry@localhost:5672';

  const connection = await amqplib.connect(url);
  const channel = await connection.createChannel();

  await channel.assertQueue(QUEUE, { durable: true });
  channel.prefetch(PREFETCH);

  console.log(`[consumer] Waiting for messages on queue: ${QUEUE}`);

  channel.consume(QUEUE, async (msg) => {
    if (!msg) return;

    let event: TelemetryReceivedEvent;

    try {
      event = JSON.parse(msg.content.toString()) as TelemetryReceivedEvent;
    } catch {
      console.error('[consumer] Failed to parse message — discarding');
      channel.nack(msg, false, false);
      return;
    }

    try {
      await handleTelemetryReceived(event, db);
      channel.ack(msg);
    } catch (err) {
      console.error('[consumer] Handler error — requeueing:', err);
      channel.nack(msg, false, true);
    }
  });

  return { connection, channel };
}
