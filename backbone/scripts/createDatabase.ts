require("dotenv").config();
const pg = require("pg");

const createDatabase = async ({ database, host, password, port, user }) => {
  console.log(`Creating database ${database} ...`);

  const client = new pg.Client({ database: "postgres", host, port, user, password });

  try {
    await client.connect();
    await client.query(`CREATE DATABASE "${database}"`);
  } catch (error) {
    console.error(`Failed to create database ${database}:`, error);
    return false;
  } finally {
    await client.end();
  }

  console.log(`Database ${database} created.`);
  return true;
};

const { DB_HOST, DB_NAME, DB_NAME_TEST, DB_PASS, DB_PORT, DB_USER, NODE_ENV } = process.env;

createDatabase({
  database: NODE_ENV === "test" ? DB_NAME_TEST : DB_NAME,
  host: DB_HOST,
  password: DB_PASS,
  port: DB_PORT,
  user: DB_USER,
}).then((success) => process.exit(success ? 0 : 1));
