import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
// 1. 대문자 Organization으로 가져와야 합니다.
import { Organization } from '@/organizations/entities/organization.entity';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  project_id: string;

  // 2. () => Organization (단수형 클래스명)
  // 3. (organization) => organization.projects (매개변수명과 속성명 일치)
  @ManyToOne(() => Organization, (organization) => organization.projects, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'org_id' })
  organization: Organization;

  // 충돌을 방지하세요
  @Column({ name: 'org_id' })
  org_id: string;

  @Column({
    comment: '고객사 내부의 큰 프로젝트 단위 제목',
    default: '미지정 프로젝트',
  })
  project_title: string;

  @Column()
  project_name: string;

  @Column({ default: 'N' })
  delete_yn: string;

  @Column({ default: 'Y' })
  display_yn: string;

  @Column()
  target_url: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
