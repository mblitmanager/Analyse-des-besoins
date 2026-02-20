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

  @Column()
  order: number;

  @Column()
  successThreshold: number;

  @Column({ nullable: true })
  recommendationLabel: string;

  @ManyToOne(() => Formation, (formation) => formation.levels)
  formation: Formation;

  @OneToMany(() => Question, (question) => question.level)
  questions: Question[];
}
