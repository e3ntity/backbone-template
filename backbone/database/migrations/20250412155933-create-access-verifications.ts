import { Const } from "backbone-sdk";
import { Kysely, sql } from "kysely";
import { createUpdatedAtTrigger, dropUpdatedAtTrigger } from "../utils/updatedAtTrigger";

const tableName = "accessVerifications";
const accessVerificationType = [
  Const.accessVerificationType.deleteUser,
  Const.accessVerificationType.signIn,
  Const.accessVerificationType.signUp,
  Const.accessVerificationType.updateEmail,
  Const.accessVerificationType.updatePhone,
];

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema.createType("access_verification_type").asEnum(accessVerificationType).execute();
  await db.schema
    .createTable(tableName)
    .addColumn("accessVerificationId", "uuid", (column) =>
      column
        .notNull()
        .primaryKey()
        .defaultTo(sql`uuid_generate_v4()`)
    )
    .addColumn("attempts", "smallint", (column) => column.notNull().defaultTo(0))
    .addColumn("code", "text", (column) => column.notNull())
    .addColumn("createdAt", "timestamp", (column) => column.notNull().defaultTo(sql`now()`))
    .addColumn("expiresAt", "timestamp", (column) => column.notNull())
    .addColumn("resendableAt", "timestamp", (column) => column.notNull())
    .addColumn("token", "text")
    .addColumn("emailOrPhone", "text", (column) => column.notNull())
    .addColumn("type", sql`access_verification_type`, (column) => column.notNull())
    .addColumn("updatedAt", "timestamp", (column) => column.notNull().defaultTo(sql`now()`))
    .execute();
  await createUpdatedAtTrigger(tableName, db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await dropUpdatedAtTrigger(tableName, db);
  await db.schema.dropTable(tableName).execute();
  await db.schema.dropType("access_verification_type").execute();
}
