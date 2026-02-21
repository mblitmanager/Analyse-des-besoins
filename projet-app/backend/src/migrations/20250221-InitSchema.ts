import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema20250221_1761273600000 implements MigrationInterface {
  name = 'InitSchema20250221_1761273600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create contacts table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "contacts" (
        "id" SERIAL PRIMARY KEY,
        "civilite" character varying NOT NULL,
        "nom" character varying NOT NULL,
        "prenom" character varying NOT NULL,
        "telephone" character varying NOT NULL,
        "email" character varying,
        "conseiller" character varying,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `);

    // Add category column to formations (if not exists)
    await queryRunner.query(`
      ALTER TABLE "formations"
      ADD COLUMN IF NOT EXISTS "category" character varying;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop category column if exists
    await queryRunner.query(`
      ALTER TABLE "formations" DROP COLUMN IF EXISTS "category";
    `);

    // Drop contacts table
    await queryRunner.query(`
      DROP TABLE IF EXISTS "contacts";
    `);
  }
}
