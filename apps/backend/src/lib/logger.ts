/**
 * Winston logger with structured JSON output
 */

import winston from 'winston';
import { env } from '../config/env.js';

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(colors);

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const transports = [
  new winston.transports.Console({
    format: env.NODE_ENV === 'production'
      ? format
      : winston.format.combine(
          winston.format.colorize({ all: true }),
          winston.format.simple()
        ),
  }),
];

// File logging in production
if (env.NODE_ENV === 'production') {
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880,
      maxFiles: 5,
    })
  );
}

export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  levels,
  format,
  transports,
  exitOnError: false,
});

// Helper: mask sensitive data in logs
export const maskSensitive = (data: unknown): unknown => {
  if (!data || typeof data !== 'object') return data;

  const sensitive = ['password', 'token', 'secret', 'authorization'];
  const cloned = { ...data as Record<string, unknown> };

  for (const key of Object.keys(cloned)) {
    if (sensitive.some(s => key.toLowerCase().includes(s))) {
      cloned[key] = '[REDACTED]';
    }
  }

  return cloned;
};