import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('workflow_steps')
export class WorkflowStep {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string;

  @Column()
  label: string;

  @Column()
  order: number;

  @Column()
  route: string;

  @Column({ default: true })
  isActive: boolean;
}
