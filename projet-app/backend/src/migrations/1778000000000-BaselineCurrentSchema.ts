import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Baseline for the existing PostgreSQL database.
 *
 * This migration intentionally does not create, alter, or drop application
 * tables. It records the current schema only after verifying that the tables
 * expected by the current entities already exist. Review the live schema and
 * take a backup before applying it in any environment.
 */
export class BaselineCurrentSchema1778000000000
  implements MigrationInterface
{
  name = 'BaselineCurrentSchema1778000000000';

  private readonly requiredTables = [
    'formations',
    'levels',
    'questions',
    'sessions',
    'contacts',
    'stagiaires',
    'workflow_steps',
    'users',
    'settings',
    'parcours_rules',
    'question_rules',
    'p3_filter_rule',
    'p3_override_rules',
    'email_templates',
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    const missing: string[] = [];

    for (const table of this.requiredTables) {
      const result = await queryRunner.query(
        `SELECT to_regclass($1) AS relation`,
        [`public.${table}`],
      );
      if (!result[0]?.relation) missing.push(table);
    }

    if (missing.length > 0) {
      throw new Error(
        `Baseline refused: missing PostgreSQL tables: ${missing.join(', ')}. ` +
          'Inspect the schema and create a real initial migration instead.',
      );
    }
  }

  public async down(): Promise<void> {
    throw new Error(
      'The current-schema baseline is irreversible. Create an explicit forward migration for any rollback or schema change.',
    );
  }
}
