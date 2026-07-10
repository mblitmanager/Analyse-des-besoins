import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEnableP3ManualChoiceToFormations20260709 implements MigrationInterface {
  name = 'AddEnableP3ManualChoiceToFormations20260709';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "formations"
      ADD COLUMN IF NOT EXISTS "enableP3ManualChoice" boolean NOT NULL DEFAULT false;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "formations"
      DROP COLUMN IF EXISTS "enableP3ManualChoice";
    `);
  }
}
