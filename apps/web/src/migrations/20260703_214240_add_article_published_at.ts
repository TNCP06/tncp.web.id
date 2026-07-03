import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`articles\` ADD \`published_at\` text;`)
  await db.run(sql`ALTER TABLE \`_articles_v\` ADD \`version_published_at\` text;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`articles\` DROP COLUMN \`published_at\`;`)
  await db.run(sql`ALTER TABLE \`_articles_v\` DROP COLUMN \`version_published_at\`;`)
}
