import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Formation } from './formation.entity';

@Entity('parcours_rules')
export class ParcoursRule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  formation: string; // e.g. "Word", "Excel", "Anglais", "Français" (Label for display)

  @Column({ nullable: true })
  formationId: number;

  @ManyToOne(() => Formation, (f) => f.parcoursRules, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'formationId' })
  formationEntity: Formation;

  @Column({ type: 'varchar', length: 255 })
  condition: string; // e.g. "Si résultat du test = Initial"

  @Column({ type: 'varchar', length: 255 })
  formation1: string; // e.g. "TOSA Word Initial"

  @Column({ type: 'varchar', length: 255 })
  formation2: string; // e.g. "TOSA Word Basique"

  @Column({ type: 'float', default: 0 })
  order: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  requirePrerequisiteFailure: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  certification: string;

  @Column({ type: 'simple-json', nullable: true })
  prerequisiteConditions: Array<{
    questionId: number;
    responseIndexes: number[];
  }>;

  @Column({ type: 'varchar', length: 10, default: 'OR' })
  prerequisiteLogic: 'AND' | 'OR';
}
