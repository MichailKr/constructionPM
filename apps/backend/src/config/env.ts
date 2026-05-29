// Временная простая версия для отладки

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '4000', 10),
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  REDIS_URL: process.env.REDIS_URL,
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
};

// Простая проверка
if (!env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set');
  console.error('Current env:', Object.keys(process.env).filter(k => k.includes('DATABASE')));
}

if (!env.JWT_SECRET || env.JWT_SECRET.length < 32) {
  console.error('❌ JWT_SECRET is missing or too short');
}

export type Env = typeof env;