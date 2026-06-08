import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('email_templates')
export class EmailTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  slug: string; // e.g. 'assessment-report', 'p3-notification', 'welcome'

  @Column()
  name: string; // Display name in admin

  @Column({ type: 'text' })
  subject: string; // Email subject with {{placeholders}}

  @Column({ type: 'text' })
  htmlContent: string; // Full HTML template with {{placeholders}}

  @Column({ type: 'text', nullable: true })
  description: string; // Admin helper text

  @Column({ type: 'simple-json', nullable: true })
  availableVariables: string[]; // List of available placeholders for this template

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
