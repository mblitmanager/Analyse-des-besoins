import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddShowIfRulesToQuestions1645000002000 implements MigrationInterface {
  name = 'AddShowIfRulesToQuestions1645000002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'questions',
      new TableColumn({
        name: 'showIfRules',
        type: 'text',
        isNullable: true,
        default: null,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('questions', 'showIfRules');
  }
}
