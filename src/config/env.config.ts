import dotenv from "dotenv";
import path from "node:path";

const NODE_ENV = process.env.NODE_ENV || "development";
dotenv.config({
    path: path.resolve(process.cwd(), `.env.${NODE_ENV}`),
});

const PORT = process.env.PORT || 3000;
const DB_URL = process.env.DATABASE_URL || "";

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

const R2_BUCKET = process.env.R2_BUCKET || "";
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_ENDPOINT = process.env.R2_ENDPOINT || "";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || "";
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || "";

const MIDTRANS_CLIENT_KEY = process.env.MIDTRANS_CLIENT_KEY || "";
const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || "";

console.log(NODE_ENV)
console.log(REDIS_HOST, REDIS_PORT, REDIS_PASSWORD);

export const config = {
    port: PORT,
    dbUrl: DB_URL,
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
    r2: {
        account_id: R2_ACCOUNT_ID || "",
        bucket: R2_BUCKET || "",
        accessKeyId: R2_ACCESS_KEY_ID || "",
        secretAccessKey: R2_SECRET_ACCESS_KEY || "",
        endpoint: R2_ENDPOINT || "",
        publicUrl: R2_PUBLIC_URL || "",
    },
    midtrans: {
        clientKey: MIDTRANS_CLIENT_KEY || "",
        serverKey: MIDTRANS_SERVER_KEY || "",
    },
};
