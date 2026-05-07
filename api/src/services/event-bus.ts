import amqplib, { type ChannelModel, type ConfirmChannel } from 'amqplib';

const QUEUE = 'telemetry.received';

let connection: ChannelModel | null = null;
let channel: ConfirmChannel | null = null;

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
  const ch = channel;
  const buffer = Buffer.from(JSON.stringify(event));
  await new Promise<void>((resolve, reject) => {
    ch.sendToQueue(QUEUE, buffer, { persistent: true }, (err: unknown) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

export async function closeEventBus(): Promise<void> {
  await channel?.close();
  await connection?.close();
}
