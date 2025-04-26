import dotenv from "dotenv";
import path from "node:path";

const NODE_ENV = process.env.NODE_ENV || "development";

dotenv.config({
    path: path.resolve(process.cwd(), `.env.${NODE_ENV}`),
});

const ACCESS_SECRET = process.env.ACCESS_SECRET || "";
const REFRESH_SECRET = process.env.REFRESH_SECRET || "";

export const config = {
    port: process.env.PORT || 3000,
    dbUrl: process.env.DATABASE_URL || "",
    env: NODE_ENV,
    jwt: {
        accessTokenSecret: ACCESS_SECRET,
        refreshTokenSecret: REFRESH_SECRET,
    },
};
