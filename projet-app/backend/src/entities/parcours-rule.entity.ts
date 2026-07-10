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

  /**
   * Quand true : ce parcours est complètement invisible pour l'apprenant,
   * même si sa condition de niveau est atteinte. Il ne sera jamais affiché
   * comme résultat dans PositionnementView.
   * Utilisé pour les cas "trop avancé" / "trop faible" qui ne doivent pas
   * apparaître dans les choix proposés.
   */
  @Column({ type: 'boolean', default: false })
  isHiddenResult: boolean;

  /**
   * Type de masquage : 'too_advanced' (niveau trop élevé) ou 'too_weak' (niveau insuffisant).
   * Null si isHiddenResult = false.
   */
  @Column({ type: 'varchar', length: 20, nullable: true })
  hiddenResultType: 'too_advanced' | 'too_weak' | null;

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

  @Column({ type: 'simple-json', nullable: true })
  selectionConditions: Array<{
    workflow: 'prerequis' | 'complementary' | 'availabilities' | 'mise_a_niveau';
    questionId: number;
    responseIndexes?: number[];
    expectedValue?: string;
    operator?: 'IN' | 'NOT_IN' | 'CONTAINS' | 'NOT_CONTAINS';
  }>;

  @Column({ type: 'varchar', length: 10, default: 'AND' })
  selectionConditionLogic: 'AND' | 'OR';

  @Column({ type: 'text', nullable: true })
  explanationMessage: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  parcoursTitle: string;
}
