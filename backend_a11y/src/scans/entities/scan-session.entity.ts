// src/scans/entities/scan-session.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Check,
} from 'typeorm';
import { ScanStatus } from './scan-status.enum';
import { Project } from '@/projects/entities/projects.entity'; // 실제 경로에 맞게 수정
import { A11yIssue } from './a11y-issue.entity'; // 실제 경로에 맞게 수정

@Entity('scan_sessions', { schema: 'public' })
@Check(`"overall_score" >= 0 AND "overall_score" <= 100`)
export class ScanSession {
  @PrimaryGeneratedColumn('uuid')
  scan_id: string;

  @Column('uuid')
  project_id: string;

  @Column({
    type: 'enum',
    enum: ScanStatus,
    default: ScanStatus.READY,
    nullable: true,
  })
  status: ScanStatus;

  @Column('int4', { nullable: true })
  overall_score: number;

  @Column('timestamptz', { nullable: true })
  started_at: Date;

  @Column('timestamptz', { nullable: true })
  finished_at: Date;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  // --- 관계 설정 (필요시 활성화) ---

  // @ManyToOne(() => Project, (project) => project.scanSessions, { onDelete: 'CASCADE' })
  // @JoinColumn({ name: 'project_id' })
  // project: Project;

  // @OneToMany(() => A11yIssue, (issue) => issue.scanSession)
  // issues: A11yIssue[];
}
