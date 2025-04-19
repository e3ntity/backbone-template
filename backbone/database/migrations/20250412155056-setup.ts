import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.executeQuery(sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`.compile(db));

  // Function to update the "updatedAt" column of a table
  await db.executeQuery(
    sql`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW."updatedAt" = now();
      RETURN NEW;
    END;
    $$ language 'plpgsql';
    `.compile(db)
  );
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.executeQuery(sql`DROP FUNCTION update_updated_at_column;`.compile(db));
}
