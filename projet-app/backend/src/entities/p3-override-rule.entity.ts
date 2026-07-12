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

  /**
   * Si true : après sélection de ce parcours dans le modal P3 override,
   * l'apprenant passe le test de positionnement avant la validation.
   * Si false (défaut) : finalisation directe sans test.
   */
  @Column({ type: 'boolean', default: false })
  requireTest: boolean;

  /**
   * Quand true (défaut) : le choix P3 est imposé peu importe le résultat du test.
   * Quand false : le résultat du test détermine le parcours + message indiquant
   * que le niveau est supérieur au choix initial.
   */
  @Column({ type: 'boolean', default: true })
  forceChoice: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  certification: string;

  @Column({ type: 'text', nullable: true })
  explanationMessage: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  parcoursTitle: string;

  /**
   * Si true : cette règle ne sera jamais affichée à l'apprenant, même si sa condition est atteinte
   * Utilisé pour les cas "niveau trop avancé" ou "niveau insuffisant"
   */
  @Column({ type: 'boolean', default: false })
  isHiddenResult: boolean;

  /**
   * Type de résultat masqué : 'too_advanced' ou 'too_weak'
   * Détermine le message d'alerte affiché
   */
  @Column({ type: 'varchar', length: 50, nullable: true })
  hiddenResultType: string;

  /**
   * Formations à afficher dans le test de positionnement
   * Utilisé pour les parcours en saisie libre (ex: IA Générative)
   * Tableau de labels de formations (ex: ["IA Générative", "Illustrator"])
   */
  @Column({ type: 'json', nullable: true })
  testFormations: string[];
}
