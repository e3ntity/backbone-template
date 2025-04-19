import * as config from "@root/config";
import { DB } from "@root/db/db";
import accessEnv from "@root/utils/accessEnv";
import { Kysely, PostgresDialect } from "kysely";
import { defaults, Pool, types } from "pg";

types.setTypeParser(types.builtins.NUMERIC, types.getTypeParser(types.builtins.NUMERIC));
types.setTypeParser(types.builtins.INT8, types.getTypeParser(types.builtins.INT8));
types.setTypeParser(types.builtins.FLOAT8, types.getTypeParser(types.builtins.FLOAT8));
types.setTypeParser(types.builtins.JSONB, types.getTypeParser(types.builtins.JSONB));

const timezoneOffset = new Date().getTimezoneOffset() * 60000;
types.setTypeParser(types.builtins.TIMESTAMP, (value) => new Date(new Date(value).getTime() - timezoneOffset));
defaults.parseInputDatesAsUTC = true;

const pool = new Pool({
  database: accessEnv(config.NODE_ENV === "test" ? "DB_NAME_TEST" : "DB_NAME"),
  host: accessEnv("DB_HOST"),
  password: accessEnv("DB_PASS"),
  port: accessEnv("DB_PORT", 5432),
  ssl: config.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  user: accessEnv("DB_USER"),
});

pool.on("connect", (client) => client.query("SET TIME ZONE 'UTC'"));

const db = new Kysely<DB>({ dialect: new PostgresDialect({ pool }) });

export default db;
