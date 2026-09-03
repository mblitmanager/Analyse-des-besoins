import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddP3OnlyToFormations1725312000000 implements MigrationInterface {
  name = 'AddP3OnlyToFormations1725312000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "formations"
      ADD COLUMN IF NOT EXISTS "p3Only" boolean NOT NULL DEFAULT false;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "formations"
      DROP COLUMN IF EXISTS "p3Only";
    `);
  }
}
