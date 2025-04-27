import dotenv from "dotenv";
import path from "node:path";

const NODE_ENV = process.env.NODE_ENV || "development";
dotenv.config({
    path: path.resolve(process.cwd(), `.env.${NODE_ENV}`),
});

const ACCESS_SECRET = process.env.ACCESS_SECRET || "";
const REFRESH_SECRET = process.env.REFRESH_SECRET || "";

const SMTP_HOST = process.env.SMTP_HOST || "";
const SMTP_PORT = process.env.SMTP_PORT || "";
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASSWORD = process.env.SMTP_PASSWORD || "";

const APP_URL = process.env.APP_URL || "";
const FE_APP_URL = process.env.FE_APP_URL || "";

const REDIS_HOST = process.env.REDIS_HOST || "";
const REDIS_PORT = process.env.REDIS_PORT || "";
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || "";

export const config = {
    port: process.env.PORT || 3000,
    dbUrl: process.env.DATABASE_URL || "",
    env: NODE_ENV,
    jwt: {
        accessTokenSecret: ACCESS_SECRET,
        refreshTokenSecret: REFRESH_SECRET,
    },
    smtp: {
        host: SMTP_HOST,
        port: Number(SMTP_PORT) || 465,
        user: SMTP_USER || "",
        password: SMTP_PASSWORD || "",
    },
    app: {
        url: APP_URL,
        feUrl: FE_APP_URL,
    },
    redis: {
        host: REDIS_HOST,
        port: Number(REDIS_PORT) || 6379,
        password: REDIS_PASSWORD || "",
    },
};
