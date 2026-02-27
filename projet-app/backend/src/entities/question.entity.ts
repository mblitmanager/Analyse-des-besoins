import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Level } from './level.entity';

@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  text: string;

  @Column({ type: 'simple-json' })
  options: string[];

  @Column()
  correctResponseIndex: number;

  @Column()
  order: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'varchar', length: 50 })
  type: string; // Dynamically accept any workflow type

  @Column({ type: 'varchar', length: 20, default: 'qcm' })
  responseType: 'qcm' | 'text' | 'checkbox';

  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true })
  icon: string;

  @Column({ type: 'simple-json', nullable: true })
  metadata: Record<string, any>;

  // Conditional display: this question only shows if a parent question's response matches conditions
  @Column({ nullable: true })
  showIfQuestionId: number; // parent question ID

  @Column({ type: 'simple-json', nullable: true })
  showIfResponseIndexes: number[]; // for qcm/checkbox: array of option indices that trigger display

  @Column({ nullable: true })
  showIfResponseValue: string; // for text questions: exact text value that triggers display

  @Column({ type: 'simple-json', nullable: true })
  showIfRules: Array<{
    questionId: number;
    responseIndexes?: number[];
    responseValue?: string;
    // future: operator: 'any'|'all' etc.
  }>;

  @ManyToOne(() => Level, (level) => level.questions, { nullable: true })
  level: Level;

  @ManyToOne('Formation', 'questions', { nullable: true })
  formation: any;
}
