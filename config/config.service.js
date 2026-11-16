import { resolve } from "node:path";
import { config } from "dotenv";
export const NODE_ENV = process.env.NODE_ENV;
const envPath = {
  development: resolve("./Config/.env.development"),
};

const path = envPath[NODE_ENV];
config({ path });

export const SERVER_PORT = parseInt(process.env.SERVER_PORT ?? 7000);
//Hash
export const SALT_ROUND = parseInt(process.env.SALT_ROUND ?? 12);
//Encryption
export const IV_LENGTH = parseInt(process.env.IV_LENGTH ?? 16);
export const ENCRYPTION_BYTE = process.env.ENCRYPTION_BYTE;
//Token
export const USER_ACCESS_TOKEN_SECRET_KEY =
  process.env.USER_ACCESS_TOKEN_SECRET_KEY;
export const ADMIN_ACCESS_TOKEN_SECRET_KEY =
  process.env.ADMIN_ACCESS_TOKEN_SECRET_KEY;
export const ACCESS_TOKEN_EXPIRES_IN = parseInt(
  process.env.ACCESS_TOKEN_EXPIRES_IN ?? 900,
);
export const USER_REFRESH_TOKEN_SECRET_KEY =
  process.env.USER_REFRESH_TOKEN_SECRET_KEY;
export const ADMIN_REFRESH_TOKEN_SECRET_KEY =
  process.env.ADMIN_REFRESH_TOKEN_SECRET_KEY;
export const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN;

//DB
export const DB_URI_LOCAL = process.env.DB_URI_LOCAL;
export const REDIS_URL = process.env.REDIS_URL;
