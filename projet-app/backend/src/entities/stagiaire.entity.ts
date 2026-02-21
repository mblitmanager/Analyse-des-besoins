import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Session } from './session.entity';

@Entity('stagiaires')
export class Stagiaire {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  civilite: string;

  @Column()
  nom: string;

  @Column()
  prenom: string;

  @Column({ unique: true })
  email: string;

  @Column()
  telephone: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Session, (session) => session.stagiaire)
  sessions: Session[];
}
