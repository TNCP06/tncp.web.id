import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`portfolio_entries\` ADD \`external_id\` text;`)
  await db.run(sql`CREATE UNIQUE INDEX \`portfolio_entries_external_id_idx\` ON \`portfolio_entries\` (\`external_id\`);`)
  await db.run(sql`ALTER TABLE \`_portfolio_entries_v\` ADD \`version_external_id\` text;`)
  await db.run(sql`CREATE INDEX \`_portfolio_entries_v_version_version_external_id_idx\` ON \`_portfolio_entries_v\` (\`version_external_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP INDEX \`portfolio_entries_external_id_idx\`;`)
  await db.run(sql`ALTER TABLE \`portfolio_entries\` DROP COLUMN \`external_id\`;`)
  await db.run(sql`DROP INDEX \`_portfolio_entries_v_version_version_external_id_idx\`;`)
  await db.run(sql`ALTER TABLE \`_portfolio_entries_v\` DROP COLUMN \`version_external_id\`;`)
}
