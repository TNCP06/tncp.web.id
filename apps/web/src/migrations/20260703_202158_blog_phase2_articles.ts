import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`articles_sources\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`url\` text,
  	\`label\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`articles\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`articles_sources_order_idx\` ON \`articles_sources\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`articles_sources_parent_id_idx\` ON \`articles_sources\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_articles_v_version_sources\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`url\` text,
  	\`label\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_articles_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_articles_v_version_sources_order_idx\` ON \`_articles_v_version_sources\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_articles_v_version_sources_parent_id_idx\` ON \`_articles_v_version_sources\` (\`_parent_id\`);`)
  await db.run(sql`ALTER TABLE \`articles\` ADD \`category\` text DEFAULT 'tech';`)
  await db.run(sql`ALTER TABLE \`articles\` ADD \`external_id\` text;`)
  await db.run(sql`ALTER TABLE \`articles\` ADD \`featured\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`articles\` ADD \`featured_score\` numeric DEFAULT 0;`)
  await db.run(sql`ALTER TABLE \`articles\` ADD \`reading_time\` numeric;`)
  await db.run(sql`CREATE UNIQUE INDEX \`articles_external_id_idx\` ON \`articles\` (\`external_id\`);`)
  await db.run(sql`ALTER TABLE \`_articles_v\` ADD \`version_category\` text DEFAULT 'tech';`)
  await db.run(sql`ALTER TABLE \`_articles_v\` ADD \`version_external_id\` text;`)
  await db.run(sql`ALTER TABLE \`_articles_v\` ADD \`version_featured\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`_articles_v\` ADD \`version_featured_score\` numeric DEFAULT 0;`)
  await db.run(sql`ALTER TABLE \`_articles_v\` ADD \`version_reading_time\` numeric;`)
  await db.run(sql`CREATE INDEX \`_articles_v_version_version_external_id_idx\` ON \`_articles_v\` (\`version_external_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`articles_sources\`;`)
  await db.run(sql`DROP TABLE \`_articles_v_version_sources\`;`)
  await db.run(sql`DROP INDEX \`articles_external_id_idx\`;`)
  await db.run(sql`ALTER TABLE \`articles\` DROP COLUMN \`category\`;`)
  await db.run(sql`ALTER TABLE \`articles\` DROP COLUMN \`external_id\`;`)
  await db.run(sql`ALTER TABLE \`articles\` DROP COLUMN \`featured\`;`)
  await db.run(sql`ALTER TABLE \`articles\` DROP COLUMN \`featured_score\`;`)
  await db.run(sql`ALTER TABLE \`articles\` DROP COLUMN \`reading_time\`;`)
  await db.run(sql`DROP INDEX \`_articles_v_version_version_external_id_idx\`;`)
  await db.run(sql`ALTER TABLE \`_articles_v\` DROP COLUMN \`version_category\`;`)
  await db.run(sql`ALTER TABLE \`_articles_v\` DROP COLUMN \`version_external_id\`;`)
  await db.run(sql`ALTER TABLE \`_articles_v\` DROP COLUMN \`version_featured\`;`)
  await db.run(sql`ALTER TABLE \`_articles_v\` DROP COLUMN \`version_featured_score\`;`)
  await db.run(sql`ALTER TABLE \`_articles_v\` DROP COLUMN \`version_reading_time\`;`)
}
