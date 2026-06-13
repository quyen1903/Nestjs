import { config } from 'dotenv';
import { resolve } from 'node:path';

const appRoot = resolve(__dirname, '..');
const workspaceRoot = resolve(appRoot, '..', '..');
const nodeEnv = process.env.NODE_ENV || 'development';

config({ path: resolve(workspaceRoot, '.env'), quiet: true });
config({ path: resolve(appRoot, '.env'), override: true, quiet: true });
config({ path: resolve(workspaceRoot, `.env.${nodeEnv}`), override: true, quiet: true });
config({ path: resolve(appRoot, `.env.${nodeEnv}`), override: true, quiet: true });

export const CREDENTIALS = process.env.CREDENTIALS === 'true';
export const KAFKA_ENABLED = ['true', '1', 'on', 'yes'].includes(
    (process.env.KAFKA_ENABLED ?? 'false').trim().toLowerCase(),
);
export const KAFKA_BROKERS = (process.env.KAFKA_BROKERS ?? process.env.KAFKA_BROKER ?? 'localhost:9092')
    .split(',')
    .map((broker) => broker.trim())
    .filter(Boolean);

export const {
    PORT,
    ORIGIN,
    DATABASE_URL,
    NODE_ENV,
    APP_SECRET,
    HOST,
    JWT_SECRET_KEY,
    JWT_ACCESS_TOKEN_EXPIRE_HOURS,
    TOKEN_DISCORD,
    CHANNELID_DISCORD,
    MAIL_HOST,
    MAIL_USER,
    MAIL_PASSWORD,
    MAIL_FROM,
} = process.env;
