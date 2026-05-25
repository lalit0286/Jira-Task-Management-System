import Redis from 'ioredis';
import { getConfig } from '@taskboard/config';

let client: Redis | null = null;

export function getRedisClient(): Redis {
  if (client) return client;
  const config = getConfig();
  client = new Redis({
    host: config.REDIS_HOST,
    port: config.REDIS_PORT,
    password: config.REDIS_PASSWORD,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
  });
  client.on('error', (err) => console.error('[redis]', err.message));
  return client;
}

export function getRedisOptions() {
  const config = getConfig();
  return {
    host: config.REDIS_HOST,
    port: config.REDIS_PORT,
    password: config.REDIS_PASSWORD,
    maxRetriesPerRequest: null as null,
    enableReadyCheck: false,
  };
}
