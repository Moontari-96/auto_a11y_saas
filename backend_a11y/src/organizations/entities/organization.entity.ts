import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany, // 추가
} from 'typeorm';
import { Project } from '@/projects/entities/projects.entity';
@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  org_id: string;

  @Column()
  org_name: string;

  @Column()
  business_number: string;

  @Column({ nullable: true })
  base_url: string;

  @Column({ default: 'N' })
  delete_yn: string;

  // 1:N 관계 설정 추가: 한 고객사는 여러 프로젝트를 가질 수 있음
  @OneToMany(() => Project, (project) => project.organization)
  projects: Project[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
