import { resolve } from "node:path";
import { config } from "dotenv";

export const NODE_ENV = process.env.NODE_ENV ?? "development";

const envPath = {
  development: resolve("./config/.env.development"),
};
config({ path: envPath[NODE_ENV] ?? envPath.development });
export const SERVER_PORT = parseInt(process.env.SERVER_PORT ?? 3000);
export const SALT_ROUND = parseInt(process.env.SALT_ROUND ?? 12);

// Token
export const USER_ACCESS_TOKEN_SECRET_KEY =
  process.env.USER_ACCESS_TOKEN_SECRET_KEY;
export const ADMIN_ACCESS_TOKEN_SECRET_KEY =
  process.env.ADMIN_ACCESS_TOKEN_SECRET_KEY;
export const USER_REFRESH_TOKEN_SECRET_KEY =
  process.env.USER_REFRESH_TOKEN_SECRET_KEY;
export const ADMIN_REFRESH_TOKEN_SECRET_KEY =
  process.env.ADMIN_REFRESH_TOKEN_SECRET_KEY;
export const ACCESS_TOKEN_EXPIRES_IN = parseInt(
  process.env.ACCESS_TOKEN_EXPIRES_IN ?? 900,
);
export const REFRESH_TOKEN_EXPIRES_IN =
  process.env.REFRESH_TOKEN_EXPIRES_IN ?? "1y";
export const ISSUER = process.env.ISSUER ?? `http://localhost:${SERVER_PORT}`;

export const DB_URI_LOCAL = process.env.DB_URI_LOCAL;
