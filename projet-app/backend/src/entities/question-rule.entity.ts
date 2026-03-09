import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('question_rules')
export class QuestionRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  workflow: string; // e.g. "prerequis", "mise_a_niveau", "availabilities"

  @Column({ type: 'varchar', nullable: true })
  formation: string | null; // e.g. "Word", "Excel", or null for global

  @Column({ type: 'int', nullable: true })
  formationId: number | null;

  @Column({ type: 'int', nullable: true })
  questionId: number | null; // which question this rule applies to

  // The condition on the response
  // We can use an operator like "EQUALS", "CONTAINS", "LESS_THAN", etc.
  @Column({ type: 'varchar', length: 50, default: 'EQUALS' })
  operator: string;

  @Column({ type: 'varchar', nullable: true })
  expectedValue: string | null; // The value to match against the answer

  // The outcome
  @Column({ type: 'varchar', length: 255 })
  resultType: 'FORMATION_RECOMMENDATION' | 'CUSTOM_MESSAGE' | 'BLOCK';

  @Column({ type: 'text', nullable: true })
  resultMessage: string | null; // The exact text/recommendation to show

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  order: number; // Order of evaluation if multiple rules apply

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
