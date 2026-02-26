import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Stagiaire } from './stagiaire.entity';

@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  brand: string;

  @Column()
  civilite: string;

  @Column()
  nom: string;

  @Column()
  prenom: string;

  @Column()
  telephone: string;

  @Column()
  conseiller: string;

  @Column({ nullable: true })
  metier: string;

  @Column('simple-json', { nullable: true })
  situation: string[];

  @Column({ nullable: true })
  formationChoisie: string;

  @Column('simple-json', { nullable: true })
  prerequisiteScore: any;

  @Column('simple-json', { nullable: true })
  levelsScores: any;

  @Column('simple-json', { nullable: true })
  positionnementAnswers: any;

  @Column({ type: 'int', nullable: true })
  scorePretest: number;

  @Column({ default: false })
  isCompleted: boolean;

  @Column({ nullable: true })
  stopLevel: string;

  @Column({ nullable: true })
  finalRecommendation: string;

  @Column({ nullable: true })
  lastValidatedLevel: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  emailSentAt: Date;

  @Column('simple-json', { nullable: true })
  complementaryQuestions: any;

  @Column('simple-json', { nullable: true })
  availabilities: any;

  @ManyToOne(() => Stagiaire, (stagiaire) => stagiaire.sessions)
  stagiaire: Stagiaire;
}
