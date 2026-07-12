import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Formation } from './formation.entity';
import { Question } from './question.entity';

@Entity('levels')
export class Level {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  label: string;

  // Short name / numeric identifier (e.g., "débutant", "avancé", or a short code like "A1")
  @Column({ type: 'varchar', nullable: true })
  shortName: string | null;

  @Column()
  order: number;

  @Column()
  successThreshold: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  consigne: string;

  @Column({ type: 'varchar', nullable: true })
  recommendationLabel: string;

  @ManyToOne(() => Formation, (formation) => formation.levels)
  formation: Formation;

  @OneToMany(() => Question, (question) => question.level)
  questions: Question[];
}
