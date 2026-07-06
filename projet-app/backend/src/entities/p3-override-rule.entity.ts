import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Formation } from './formation.entity';

@Entity('p3_override_rules')
export class P3OverrideRule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  formation: string;

  @Column({ nullable: true })
  formationId: number;

  @ManyToOne(() => Formation, (f) => f.p3OverrideRules, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'formationId' })
  formationEntity: Formation;

  @Column({ type: 'varchar', length: 255 })
  condition: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  conditionP1: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  conditionP2: string | null;

  @Column({ type: 'varchar', length: 255 })
  formation1: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  formation2: string;

  @Column({ type: 'float', default: 0 })
  order: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  certification: string;

  @Column({ type: 'text', nullable: true })
  explanationMessage: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  parcoursTitle: string;
}
