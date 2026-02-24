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
  type: 'prerequis' | 'positionnement' | 'complementary' | 'availabilities';

  @Column({ type: 'varchar', length: 20, default: 'qcm' })
  responseType: 'qcm' | 'text';

  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true })
  icon: string;

  @Column({ type: 'simple-json', nullable: true })
  metadata: Record<string, any>;

  @ManyToOne(() => Level, (level) => level.questions, { nullable: true })
  level: Level;

  @ManyToOne('Formation', 'questions', { nullable: true })
  formation: any;
}
