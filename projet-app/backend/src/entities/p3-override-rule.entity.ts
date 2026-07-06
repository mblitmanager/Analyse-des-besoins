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
  formation: string; // e.g. "Word", "Excel", "Anglais" (Label for display)

  @Column({ nullable: true })
  formationId: number;

  @ManyToOne(() => Formation, (f) => f.p3OverrideRules, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'formationId' })
  formationEntity: Formation;

  @Column({ type: 'varchar', length: 255 })
  condition: string; // e.g. "Si niveau validé = Basique" or "Si niveau validé >= Basique"

  @Column({ type: 'varchar', length: 255 })
  formation1: string; // Formation proposée en P3 (ex: "TOSA Word Opérationnel")

  @Column({ type: 'varchar', length: 255, nullable: true })
  formation2: string; // Formation alternative (ex: "TOSA Word Avancé")

  @Column({ type: 'float', default: 0 })
  order: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  certification: string; // Certification délivrée (ex: "RS5432 - TOEIC Listening & Reading")

  @Column({ type: 'text', nullable: true })
  explanationMessage: string; // Message explicatif pour le candidat

  @Column({ type: 'varchar', length: 255, nullable: true })
  parcoursTitle: string; // Intitulé du parcours affiché en grand
}
