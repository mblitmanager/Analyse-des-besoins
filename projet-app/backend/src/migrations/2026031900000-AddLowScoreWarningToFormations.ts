import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLowScoreWarningToFormations2026031900000 implements MigrationInterface {
  name = 'AddLowScoreWarningToFormations2026031900000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "formations" 
      ADD COLUMN IF NOT EXISTS "enableLowScoreWarning" boolean NOT NULL DEFAULT true;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "formations" 
      DROP COLUMN IF EXISTS "enableLowScoreWarning";
    `);
  }
}
