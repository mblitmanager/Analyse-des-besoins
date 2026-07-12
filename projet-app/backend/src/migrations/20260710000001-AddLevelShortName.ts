import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLevelShortName20260710000001 implements MigrationInterface {
  name = 'AddLevelShortName20260710000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "levels"
      ADD COLUMN IF NOT EXISTS "shortName" varchar NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "levels"
      DROP COLUMN IF EXISTS "shortName";
    `);
  }
}
