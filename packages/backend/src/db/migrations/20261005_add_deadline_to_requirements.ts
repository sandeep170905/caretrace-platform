import { Knex } from 'knex';

/**
 * Migration: Add nullable 'deadline' column to requirements table.
 * 100% additive change to support campaign/requirement deadlines for Reviewer Demo mode.
 */
export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('requirements');
  if (hasTable) {
    const hasColumn = await knex.schema.hasColumn('requirements', 'deadline');
    if (!hasColumn) {
      await knex.schema.alterTable('requirements', (t) => {
        t.string('deadline').nullable();
      });
      console.log('✅ Migration: Added nullable "deadline" column to "requirements" table.');
    }
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('requirements');
  if (hasTable) {
    const hasColumn = await knex.schema.hasColumn('requirements', 'deadline');
    if (hasColumn) {
      await knex.schema.alterTable('requirements', (t) => {
        t.dropColumn('deadline');
      });
      console.log('⏪ Migration: Rolled back "deadline" column on "requirements" table.');
    }
  }
}
