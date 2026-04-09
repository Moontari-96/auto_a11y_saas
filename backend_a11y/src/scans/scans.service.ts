import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ScanSession } from './entities/scan-session.entity';
import { ScanStatus } from './entities/scan-status.enum';
import { A11yIssue } from './entities/a11y-issue.entity';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import axios, { AxiosResponse, isAxiosError } from 'axios';

interface WorkerScanResult {
  ruleId: string;
  severity: string;
  selector: string;
  description: string;
  // Add other properties if they exist in the worker's issue object
}

interface WorkerScanResponse {
  success: boolean;
  results: WorkerScanResult[];
  // Add other properties if they exist in the worker's response
}
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

  async requestScanToWorker(url: string, projectId: string): Promise<string> {
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
      const response: AxiosResponse<WorkerScanResponse> = await firstValueFrom(
        this.httpService.post<WorkerScanResponse>(workerUrl, {
          targetUrl: url,
          scanId,
          projectId,
        }),
      );

      const { success, results } = response.data;

      if (success && Array.isArray(results)) {
        console.log(`[DB] ${results.length}개의 위반 사항 저장 시작...`);

        const issuesToSave = results.map((issue: WorkerScanResult) =>
          this.issueRepository.create({
            scan_id: scanId,
            rule_id: issue.ruleId,
            severity: issue.severity,
            element_selector: issue.selector,
            description: issue.description,
            raw_detail: issue as any,
          }),
        );

        await this.issueRepository.save(issuesToSave);

        const score = Math.max(0, 100 - results.length * 5);
        await this.scanRepository.update(scanId, {
          status: ScanStatus.COMPLETED,
          finished_at: new Date(),
          overall_score: score,
        });

        console.log(`[DB] 검사 결과 저장 완료 (최종 점수: ${score})`);
      }

      return scanId;
    } catch (error: unknown) {
      console.error(`[Error] 검사 처리 중 오류 발생:`, error);
      await this.scanRepository.update(scanId, { status: ScanStatus.FAILED });

      let errorMessage = '검사 결과 처리 중 오류가 발생했습니다.';
      if (axios.isAxiosError(error)) {
        errorMessage = `워커 서버 통신 오류: ${error.message}`;
      } else if (error instanceof Error) {
        errorMessage = `알 수 없는 오류 발생: ${error.message}`;
      }

      throw new InternalServerErrorException(errorMessage);
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
