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

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Level, (level) => level.formation)
  levels: Level[];
}
