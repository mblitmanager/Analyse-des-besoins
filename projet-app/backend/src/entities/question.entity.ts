import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Level } from './level.entity';

@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  text: string;

  @Column('simple-json')
  options: string[];

  @Column()
  correctResponseIndex: number;

  @Column()
  order: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'varchar', length: 50 })
  type: 'prerequis' | 'positionnement';

  @ManyToOne(() => Level, (level) => level.questions, { nullable: true })
  level: Level;
}
