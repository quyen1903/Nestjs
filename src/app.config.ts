import { config } from 'dotenv';
config({ path: `.env.${process.env.NODE_ENV || 'development'}` });

export const CREDENTIALS = process.env.CREDENTIALS === 'true';

export const {
  PORT,
  ORIGIN,
  DATABASE_URL,
  NODE_ENV,
  APP_SECRET,
  HOST,
  JWT_SECRET_KEY,
  JWT_ACCESS_TOKEN_EXPIRE_HOURS,
  REDIS_HOST,
  REDIS_PORT,
  REDIS_URL
} = process.env;