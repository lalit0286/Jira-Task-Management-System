import pino from 'pino';

const isDev = process.env.NODE_ENV !== 'production';

export const logger = pino({
  name: 'taskboard-api',
  level: process.env.LOG_LEVEL || 'info',
  transport: isDev
    ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard', ignore: 'pid,hostname' } }
    : undefined,
  timestamp: pino.stdTimeFunctions.isoTime,
});

export function createLogger(name: string) {
  return logger.child({ module: name });
}
