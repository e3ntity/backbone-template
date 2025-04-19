import { Kysely, sql } from "kysely";
import { createUpdatedAtTrigger, dropUpdatedAtTrigger } from "../utils/updatedAtTrigger";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("userSessions")
    .addColumn("createdAt", "timestamp", (column) => column.notNull().defaultTo(sql`now()`))
    .addColumn("deviceId", "uuid", (column) => column.notNull().defaultTo(sql`uuid_generate_v4()`))
    .addColumn("expiresAt", "timestamp", (column) => column.notNull())
    .addColumn("ipAddress", sql`inet`, (column) => column)
    .addColumn("updatedAt", "timestamp", (column) => column.notNull().defaultTo(sql`now()`))
    .addColumn("userId", "uuid", (column) =>
      column.notNull().references("users.userId").onUpdate("cascade").onDelete("cascade")
    )
    .addColumn("userSessionId", "uuid", (column) =>
      column
        .notNull()
        .primaryKey()
        .defaultTo(sql`uuid_generate_v4()`)
    )
    .execute();
  await createUpdatedAtTrigger("userSessions", db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await dropUpdatedAtTrigger("userSessions", db);
  await db.schema.dropTable("userSessions").execute();
}
