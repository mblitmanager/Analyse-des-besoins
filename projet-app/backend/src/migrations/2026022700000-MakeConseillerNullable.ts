import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class MakeConseillerNullable2026022700000 implements MigrationInterface {
  name = 'MakeConseillerNullable2026022700000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // change column to allow null values
    await queryRunner.changeColumn(
      'sessions',
      'conseiller',
      new TableColumn({
        name: 'conseiller',
        type: 'varchar',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // revert to not nullable
    await queryRunner.changeColumn(
      'sessions',
      'conseiller',
      new TableColumn({
        name: 'conseiller',
        type: 'varchar',
        isNullable: false,
      }),
    );
  }
}
