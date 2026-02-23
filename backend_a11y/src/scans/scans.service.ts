import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm'; // DataSource 추가 (트랜잭션 권장)
import { ScanSession } from './entities/scan-session.entity';
import { ScanStatus } from './entities/scan-status.enum';
import { A11yIssue } from './entities/a11y-issue.entity';
@Injectable()
export class ScansService {
  constructor(
    private readonly httpService: HttpService,
    @InjectRepository(ScanSession)
    private readonly scanRepository: Repository<ScanSession>,
    @InjectRepository(A11yIssue)
    private readonly issueRepository: Repository<A11yIssue>,
    private dataSource: DataSource, // 대량 저장을 위한 데이터소스
  ) {}

  async requestScanToWorker(
    url: string,
    projectId: string,
    orgId: string,
  ): Promise<string> {
    const workerUrl = 'http://localhost:4000/run-scan';

    // 1. DB에 검사 세션 생성 (상태: RUNNING)
    const newSession = this.scanRepository.create({
      project_id: projectId,
      status: ScanStatus.PROGRESS,
      started_at: new Date(),
    });
    const savedSession = await this.scanRepository.save(newSession);
    const scanId = savedSession.scan_id;

    try {
      // 2. 워커 서버로 요청 및 결과 대기
      const response = await firstValueFrom(
        this.httpService.post(workerUrl, { targetUrl: url, scanId, projectId }),
      );

      const results = response.data.results; // 워커가 보내준 8개의 위반 사항

      if (response.data.success && Array.isArray(results)) {
        console.log(`[DB] ${results.length}개의 위반 사항 저장 시작...`);

        // 3. 위반 사항 저장 (벌크 인서트)
        const issuesToSave = results.map((issue) =>
          this.issueRepository.create({
            scan_id: scanId,
            rule_id: issue.ruleId,
            severity: issue.severity,
            element_selector: issue.selector,
            description: issue.description,
            raw_detail: issue, // 원본 데이터 전체 저장
          }),
        );

        await this.issueRepository.insert(issuesToSave);

        // 4. 세션 상태 업데이트 (완료 및 점수 계산 - 예시로 100점에서 감점 처리)
        const score = Math.max(0, 100 - results.length * 5); // 이슈당 5점 감점 예시
        await this.scanRepository.update(scanId, {
          status: ScanStatus.COMPLETED,
          finished_at: new Date(),
          overall_score: score,
        });

        console.log(`[DB] 검사 결과 저장 완료 (최종 점수: ${score})`);
      }

      return scanId;
    } catch (error) {
      console.error(`[Error] 검사 처리 중 오류 발생:`, error.message);
      await this.scanRepository.update(scanId, { status: ScanStatus.FAILED });
      throw new InternalServerErrorException(
        '검사 결과 처리 중 오류가 발생했습니다.',
      );
    }
  }

  async getScanStatus(scanId: string): Promise<string> {
    const session = await this.scanRepository.findOne({
      where: { scan_id: scanId },
      select: ['status'], // 성능을 위해 status만 선택
    });

    if (!session) {
      return 'FAILED'; // 세션이 없으면 실패로 간주
    }

    return session.status; // 'PROGRESS', 'COMPLETED', 'FAILED' 등이 반환됨
  }
}
