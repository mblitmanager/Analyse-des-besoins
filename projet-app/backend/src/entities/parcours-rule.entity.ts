import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('parcours_rules')
export class ParcoursRule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  formation: string; // e.g. "Word", "Excel", "Anglais", "Français"

  @Column({ type: 'varchar', length: 255 })
  condition: string; // e.g. "Si résultat du test = Initial"

  @Column({ type: 'varchar', length: 255 })
  formation1: string; // e.g. "TOSA Word Initial"

  @Column({ type: 'varchar', length: 255 })
  formation2: string; // e.g. "TOSA Word Basique"

  @Column({ type: 'int', default: 0 })
  order: number;
}
