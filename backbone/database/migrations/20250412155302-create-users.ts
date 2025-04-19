import { Kysely, sql } from "kysely";
import { createUpdatedAtTrigger, dropUpdatedAtTrigger } from "../utils/updatedAtTrigger";

const tableName = "users";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable(tableName)
    .addColumn("bannedAt", "timestamp")
    .addColumn("createdAt", "timestamp", (column) => column.notNull().defaultTo(sql`now()`))
    .addColumn("email", "text", (column) => column.unique())
    .addColumn("googleUserId", "text", (column) => column.unique())
    .addColumn("localTZOffset", "smallint", (column) => column.notNull().defaultTo(0))
    .addColumn("name", "text", (column) => column.notNull())
    .addColumn("phone", "text", (column) => column.unique())
    .addColumn("updatedAt", "timestamp", (column) => column.notNull().defaultTo(sql`now()`))
    .addColumn("userId", "uuid", (column) =>
      column
        .notNull()
        .primaryKey()
        .defaultTo(sql`uuid_generate_v4()`)
    )
    .addCheckConstraint("email_or_phone_not_null", sql`email IS NOT NULL OR phone IS NOT NULL`)
    .execute();
  await createUpdatedAtTrigger(tableName, db);

  // Trigger to set createdAt in other tables based on users.localTZOffset (use createCreatedAtUTZTrigger helper)
  await db.executeQuery(
    sql`
    CREATE OR REPLACE FUNCTION set_created_at_utz()
    RETURNS TRIGGER AS $$
    DECLARE
      local_tz_offset INTEGER;
    BEGIN
      IF NEW."createdAtUTZ" IS NULL THEN
        SELECT "localTZOffset" INTO local_tz_offset FROM "users" WHERE "userId" = NEW."userId";

        IF local_tz_offset IS NULL THEN
          local_tz_offset := 0;
        END IF;

        NEW."createdAtUTZ" := (NEW."createdAt" AT TIME ZONE 'UTC' + (local_tz_offset * INTERVAL '1 hour'));
      END IF;

      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `.compile(db)
  );
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.executeQuery(sql`DROP FUNCTION IF EXISTS set_created_at_utz();`.compile(db));
  await dropUpdatedAtTrigger(tableName, db);
  await db.schema.dropTable(tableName).execute();
}
