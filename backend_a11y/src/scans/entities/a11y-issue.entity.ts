import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ScanSession } from './scan-session.entity';

@Entity('a11y_issues', { schema: 'public' })
export class A11yIssue {
  @PrimaryGeneratedColumn('uuid')
  issue_id: string;

  @Column('uuid')
  scan_id: string;

  @Column({ type: 'varchar', length: 100 })
  rule_id: string; // 예: 'color-contrast', 'image-alt' 등

  @Column({ type: 'varchar', length: 20, nullable: true })
  severity: string; // 예: 'critical', 'serious', 'moderate', 'minor'

  @Column({ type: 'text', nullable: true })
  element_selector: string; // 해당 결함이 발견된 HTML 요소 선택자

  @Column({ type: 'text', nullable: true })
  description: string; // 결함에 대한 설명

  @Column({ type: 'jsonb', nullable: true })
  raw_detail: any; // 워커에서 보내온 상세 원본 데이터 (JSON)

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  // --- 관계 설정 ---

  // 여러 개의 이슈는 하나의 스캔 세션에 속합니다.
  @ManyToOne(() => ScanSession, (session) => session.scan_id, {
    onDelete: 'CASCADE', // 세션 삭제 시 관련 이슈도 모두 삭제
  })
  @JoinColumn({ name: 'scan_id' })
  scanSession: ScanSession;
}
