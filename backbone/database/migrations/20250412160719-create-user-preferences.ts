import { Const } from "backbone-sdk";
import { Kysely, sql } from "kysely";
import { snakeCase } from "lodash";
import { createUpdatedAtTrigger, dropUpdatedAtTrigger } from "../utils/updatedAtTrigger";

const upn = Const.userPreferenceName;

const tableName = "userPreferences";
export const preferenceName = [];

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema.createType("user_preference_name").asEnum(preferenceName).execute();
  await db.schema
    .createTable(tableName)
    .addColumn("createdAt", "timestamp", (column) => column.notNull().defaultTo(sql`now()`))
    .addColumn("name", sql`user_preference_name`, (column) => column.notNull())
    .addColumn("updatedAt", "timestamp", (column) => column.notNull().defaultTo(sql`now()`))
    .addColumn("userId", "uuid", (column) =>
      column.notNull().references("users.userId").onUpdate("cascade").onDelete("cascade")
    )
    .addColumn("userPreferenceId", "uuid", (column) =>
      column
        .notNull()
        .primaryKey()
        .defaultTo(sql`uuid_generate_v4()`)
    )
    .addColumn("value", "jsonb", (column) => column.notNull())
    .addUniqueConstraint(`unique_${snakeCase(tableName)}_name_user_id`, ["name", "userId"])
    .execute();
  await createUpdatedAtTrigger(tableName, db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await dropUpdatedAtTrigger(tableName, db);
  await db.schema.dropTable(tableName).execute();
  await db.schema.dropType("user_preference_name").execute();
}
