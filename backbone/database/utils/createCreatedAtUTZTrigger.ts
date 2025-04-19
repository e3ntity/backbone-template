import { Kysely, QueryResult, sql } from "kysely";
import { snakeCase } from "lodash";

export async function createCreatedAtUTZTrigger(tableName: string, db: Kysely<any>): Promise<QueryResult<any>> {
  const triggerName = `set_${snakeCase(tableName)}_created_at_utz`;

  return await db.executeQuery(
    sql`
    CREATE TRIGGER ${sql.raw(triggerName)}
    BEFORE INSERT ON ${sql.table(tableName)}
    FOR EACH ROW
    EXECUTE FUNCTION set_created_at_utz();
    `.compile(db)
  );
}

export async function dropCreatedAtUTZTrigger(tableName: string, db: Kysely<any>): Promise<QueryResult<any>> {
  const triggerName = `set_${snakeCase(tableName)}_created_at_utz`;

  return await db.executeQuery(sql`DROP TRIGGER ${sql.raw(triggerName)} ON ${sql.table(tableName)};`.compile(db));
}
