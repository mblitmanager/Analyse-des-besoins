import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('p3_filter_rule')
export class P3FilterRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  sourceCategory: string;

  @Column('simple-array', { nullable: true })
  sourceSlugs: string[];

  @Column({ nullable: true, type: 'int' })
  maxLevelOrder: number;

  @Column({ default: 'EXCLUDE' })
  filterMode: string; // 'ALLOW_ONLY' | 'EXCLUDE'

  @Column('simple-array', { nullable: true })
  targetSlugs: string[];

  @Column('simple-array', { nullable: true })
  targetCategories: string[];

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  order: number;
}
