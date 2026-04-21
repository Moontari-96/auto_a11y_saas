import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
// 1. 대문자 Organization으로 가져와야 합니다.
import { Organization } from '@/organizations/entities/organization.entity';
import { ScanSession } from '@/scans/entities/scan-session.entity';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  project_id?: string;

  // 2. () => Organization (단수형 클래스명)
  // 3. (organization) => organization.projects (매개변수명과 속성명 일치)
  @ManyToOne(() => Organization, (organization) => organization.projects, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'org_id' })
  organization?: Organization; // 타입은 클래스인 Organization이어야 합니다.

  @Column({ type: 'int', nullable: true }) // 혹은 uuid 등 DB 타입에 맞게
  org_id?: number; // 실제 DB에 저장될 ID 컬럼을 명시적으로 분리하면 관리가 편합니다.
  
  @Column({
    comment: '고객사 내부의 큰 프로젝트 단위 제목',
    default: '미지정 프로젝트',
  })
  project_title?: string;

  @Column()
  project_name?: string;

  @Column({ default: 'N' })
  delete_yn?: string;

  @Column({ default: 'Y' })
  display_yn?: string;

  @Column()
  target_url?: string;

  @CreateDateColumn()
  created_at?: Date;

  @UpdateDateColumn()
  updated_at?: Date;

  @OneToMany(() => ScanSession, (scanSession) => scanSession.project)
  scanSessions?: ScanSession[];
}
