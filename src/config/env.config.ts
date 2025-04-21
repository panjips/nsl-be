import dotenv from 'dotenv';
import path from 'path';

const NODE_ENV = process.env.NODE_ENV || 'development';

dotenv.config({
  path: path.resolve(process.cwd(), `.env.${NODE_ENV}`)
});

export const config = {
  port: process.env.PORT || 3000,
  dbUrl: process.env.DATABASE_URL || '',
  env: NODE_ENV,
};
