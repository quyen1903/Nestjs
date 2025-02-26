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
  AWS_ACCESS_KEY,
  AWS_SECRET_ACCESS_KEY,
  AWS_REGION,
  ASSET_S3_BUCKET,
  ASSET_S3_URL_EXPIRATION,
  ASSET_S3_IMAGE_FOLDER,
  ASSET_REMOVE_REDUNDANT_EXPIRATION,
  MAIL_HOST,
  MAIL_USER,
  MAIL_PASSWORD,
  MAIL_FROM,
  API_DOMAIN,
  COOLSMS_KEY,
  COOLSMS_SECRET,
  COOLSMS_NUMBER,
  GOOGLE_CALENDAR_URL,
  GOOGLE_CALENDAR_KEY,
} = process.env;
