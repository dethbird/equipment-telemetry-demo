import amqplib, { type Channel, type Connection } from 'amqplib';

const QUEUE = 'telemetry.received';

let connection: Connection | null = null;
let channel: Channel | null = null;

export async function connectEventBus(): Promise<void> {
  const url = process.env.RABBITMQ_URL || 'amqp://telemetry:telemetry@localhost:5672';
  connection = await amqplib.connect(url);
  channel = await connection.createConfirmChannel();
  await channel.assertQueue(QUEUE, { durable: true });
}

export async function publish(event: object): Promise<void> {
  if (!channel) {
    throw new Error('Event bus not connected. Call connectEventBus() first.');
  }
  const buffer = Buffer.from(JSON.stringify(event));
  await new Promise<void>((resolve, reject) => {
    (channel as Channel).sendToQueue(QUEUE, buffer, { persistent: true }, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

export async function closeEventBus(): Promise<void> {
  await channel?.close();
  await connection?.close();
}
