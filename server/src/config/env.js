import dotenv from "dotenv";

dotenv.config();

export const ENV = {
  PORT: Number(process.env.PORT || 3001),
  JWT_SECRET: process.env.JWT_SECRET || "eiko_secret_jwt_key_2026_super_secure",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  DB_HOST: process.env.DB_HOST || "localhost",
  DB_USER: process.env.DB_USER || "root",
  DB_PASSWORD: process.env.DB_PASSWORD || "412005",
  DB_NAME: process.env.DB_NAME || "eiko_shop",
  DB_PORT: Number(process.env.DB_PORT || 3306),
};
