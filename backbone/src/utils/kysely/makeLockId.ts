import { DB } from "@root/db/db";
import crypto from "crypto";

const PSQL_MAX_BIGINT = BigInt("9223372036854775807");

/**
 * Generates a lock ID for PostgreSQL advisory locks.
 * Combines the table name and provided key-value pairs to create a unique lock ID.
 *
 * @param tableName - The name of the table related to the lock.
 * @param args - An object containing key-value pairs to include in the lock ID.
 * @returns A tuple containing two 32-bit integers representing the lock ID.
 */
export default function makeLockId(tableName: keyof DB, args: Record<string, string | number> = {}): bigint {
  const hash = crypto.createHash("sha256");

  hash.update(tableName);

  const keys = Object.keys(args).sort();
  for (const key of keys) {
    const value = args[key];
    hash.update(`${key}:${value}`);
  }

  const digest = hash.digest();

  return BigInt(`0x${digest.subarray(0, 8).toString("hex")}`) % PSQL_MAX_BIGINT;
}
