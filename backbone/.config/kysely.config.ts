import "dotenv/config";
import { PostgresDialect } from "kysely";
import { defineConfig } from "kysely-ctl";
import { Pool } from "pg";

const database = process.env.NODE_ENV === "test" ? process.env.DB_NAME_TEST : process.env.DB_NAME;
const dialect = new PostgresDialect({
  pool: new Pool({
    database,
    host: process.env.DB_HOST,
    password: process.env.DB_PASS,
    port: parseInt(process.env.DB_PORT || "5432"),
    user: process.env.DB_USER,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  }),
});

export default defineConfig({
  dialect,
  migrations: { migrationFolder: "database/migrations" },
  seeds: { seedFolder: "database/seeds" },
});
