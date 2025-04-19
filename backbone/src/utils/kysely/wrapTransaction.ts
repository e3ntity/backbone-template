import db from "@root/db";
import { DB } from "@root/db/db";
import { Transaction } from "kysely";

type TransactionalArgs<T> = Omit<T, "trx"> & { trx?: Transaction<DB> };
type TransactionFunction<T extends { trx: Transaction<DB> }, R> = (args: T) => Promise<R>;

/**
 * Wraps an arbitrary async function in a kysely database transaction.
 * The resulting function accepts an optional transaction and will start a new one if none is provided.
 *
 * @param fn - The function to wrap.
 * @returns The wrapped function.
 */
const wrapTransaction =
  <T extends { trx: Transaction<DB> }, R = typeof db>(fn: TransactionFunction<T, R>) =>
  (args: TransactionalArgs<T>): Promise<R> =>
    args.trx === undefined ? db.transaction().execute((trx) => fn({ trx, ...args } as T)) : fn(args as T);

export default wrapTransaction;
