import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHighLevelToFormations20260710000000 implements MigrationInterface {
  name = 'AddHighLevelToFormations20260710000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "formations"
      ADD COLUMN IF NOT EXISTS "enableHighLevelAlert" boolean NOT NULL DEFAULT true;
    `);

    await queryRunner.query(`
      ALTER TABLE "formations"
      ADD COLUMN IF NOT EXISTS "maxLevelOrder" integer NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "formations"
      DROP COLUMN IF EXISTS "maxLevelOrder";
    `);

    await queryRunner.query(`
      ALTER TABLE "formations"
      DROP COLUMN IF EXISTS "enableHighLevelAlert";
    `);
  }
}
