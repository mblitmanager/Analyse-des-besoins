import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddConditionalDisplayFieldsToQuestions1645000001000
  implements MigrationInterface
{
  name = 'AddConditionalDisplayFieldsToQuestions1645000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add showIfQuestionId column
    await queryRunner.addColumn(
      'questions',
      new TableColumn({
        name: 'showIfQuestionId',
        type: 'integer',
        isNullable: true,
        default: null,
      }),
    );

    // Add showIfResponseIndexes column (JSON array)
    await queryRunner.addColumn(
      'questions',
      new TableColumn({
        name: 'showIfResponseIndexes',
        type: 'text', // JSON stored as text
        isNullable: true,
        default: null,
      }),
    );

    // Add showIfResponseValue column
    await queryRunner.addColumn(
      'questions',
      new TableColumn({
        name: 'showIfResponseValue',
        type: 'varchar',
        length: '500',
        isNullable: true,
        default: null,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('questions', 'showIfQuestionId');
    await queryRunner.dropColumn('questions', 'showIfResponseIndexes');
    await queryRunner.dropColumn('questions', 'showIfResponseValue');
  }
}
