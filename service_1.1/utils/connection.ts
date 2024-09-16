import * as dotenv from 'dotenv';
import pkg from 'pg';
import { Client } from 'pg';

dotenv.config();

const { Pool } = pkg;

//Параметры подключения к БД
export const config = {
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT ? parseInt(process.env.POSTGRES_PORT) : undefined,
  user: process.env.POSTGRES_USERNAME,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB
};

export const pool = new Pool(config);

export const client = new Client(config);

export const urlChanges = 'http://localhost:3001';