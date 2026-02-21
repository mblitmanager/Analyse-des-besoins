import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Level } from './level.entity';

@Entity('formations')
export class Formation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  slug: string;

  @Column()
  label: string;

  @Column({ type: 'text', nullable: true })
  objectifs: string;

  @Column({ type: 'text', nullable: true })
  prequis: string;

  @Column({ type: 'text', nullable: true })
  modaliteDuree: string;

  @Column({ nullable: true })
  dateEnregistrement: string;

  @Column({ nullable: true })
  certificateur: string;

  @Column({ type: 'text', nullable: true })
  programme: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Level, (level) => level.formation)
  levels: Level[];
}
