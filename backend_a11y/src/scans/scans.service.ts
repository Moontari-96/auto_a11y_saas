import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ScanSession } from './entities/scan-session.entity';
import { ScanStatus } from './entities/scan-status.enum';
import { A11yIssue } from './entities/a11y-issue.entity';
import axios, { AxiosResponse } from 'axios';
import { Project } from '@/projects/entities/projects.entity'; // 경로 확인
import {
  RawHistoryResult,
  WorkerScanResponse,
  WorkerScanResult,
} from './types/scans.interface';

@Injectable()
export class ScansService {
  constructor(
    private readonly httpService: HttpService,
    @InjectRepository(ScanSession)
    private readonly scanRepository: Repository<ScanSession>,
    @InjectRepository(A11yIssue)
    private readonly issueRepository: Repository<A11yIssue>,
    private dataSource: DataSource,
  ) {}

  workerUrl: string = `${process.env.WORKER_URL || 'http://localhost:4000'}`;

  async requestScanToWorker(url: string, projectId: string): Promise<string> {
    const apiUrl = `${this.workerUrl}/run-scan`;

    // 2. DB에 검사 세션 생성 (target_url 추가)
    const newSession = this.scanRepository.create({
      project_id: projectId,
      target_url: url, // 앞서 DB에 추가한 타겟 URL 저장
      status: ScanStatus.PROGRESS,
      started_at: new Date(),
    });
    const savedSession = await this.scanRepository.save(newSession);
    const scanId = savedSession.scan_id;

    try {
      const response: AxiosResponse<WorkerScanResponse> = await firstValueFrom(
        this.httpService.post<WorkerScanResponse>(apiUrl, {
          targetUrl: url,
          scanId,
          projectId,
        }),
      );

      const { success, results } = response.data;

      if (success && Array.isArray(results)) {
        console.log(`[DB] ${results.length}개의 위반 사항 저장 시작...`);

        // 3. 확장된 데이터를 바탕으로 이슈 엔티티 생성
        const issuesToSave = results.map((issue: WorkerScanResult) => {
          // description이 비어있을 경우 failureSummary를 우선 사용
          const finalDescription = issue.failureSummary || issue.description;

          return this.issueRepository.create({
            scan_id: scanId,
            target_url: url, // 매개변수로 받은 url
            engine: issue.source,
            rule_id: issue.ruleId,
            severity: issue.severity,
            element_selector: issue.selector ?? undefined,
            description: finalDescription ?? undefined,
            // any 대신 안전하게 형변환
            raw_detail: (issue.rawDetail || issue) as unknown as Record<
              string,
              unknown
            >,
          });
        });

        // 4. 대량의 이슈 데이터를 한 번에 저장 (TypeORM bulk insert)
        await this.issueRepository.save(issuesToSave);

        // 5. 심각도 기반의 정교한 점수 산출 로직 적용
        let score = 100;
        results.forEach((issue) => {
          if (issue.severity === 'critical') score -= 10;
          else if (issue.severity === 'serious') score -= 5;
          else if (issue.severity === 'moderate') score -= 2;
          else if (issue.severity === 'minor') score -= 1;
        });
        const finalScore = Math.max(0, score); // 점수가 0 이하로 떨어지지 않게 방어

        // 6. 스캔 세션 업데이트 (완료 상태, 종료 시간, 산출된 점수)
        await this.scanRepository.update(scanId, {
          status: ScanStatus.COMPLETED,
          finished_at: new Date(),
          overall_score: finalScore,
        });

        console.log(`[DB] 검사 결과 저장 완료 (최종 점수: ${finalScore}점)`);
      }

      return scanId;
    } catch (error: unknown) {
      console.error(`[Error] 검사 처리 중 오류 발생:`, error);

      // 실패 시 세션 상태를 FAILED로 업데이트
      await this.scanRepository.update(scanId, {
        status: ScanStatus.FAILED,
        finished_at: new Date(), // 실패한 시점도 기록하면 좋습니다
      });

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
      select: ['status'],
    });

    if (!session) {
      return 'FAILED';
    }

    return session.status;
  }

  async findOne(scanId: string) {
    // 1. DB에서 해당 scan_id를 가진 스캔 세션 조회
    const session = await this.scanRepository.findOne({
      where: { scan_id: scanId },
      // 프론트엔드에서 필요한 status와 overall_score 등 필요한 컬럼만 지정하거나 생략 가능
      select: [
        'scan_id',
        'status',
        'overall_score',
        'started_at',
        'finished_at',
      ],
    });

    // 2. 만약 없는 ID를 요청했다면 404 에러 발생
    if (!session) {
      throw new NotFoundException(
        `해당 스캔 내역(${scanId})을 찾을 수 없습니다.`,
      );
    }

    // 3. 조회된 세션 객체 전체를 반환 (프론트에서 session.status 형태로 접근 가능)
    return session;
  }

  async historyReporting(orgId: string) {
    try {
      // 2. getRawMany<RawHistoryResult>() 를 통해 타입을 명시합니다.
      const rawResults = await this.scanRepository
        .createQueryBuilder('scan')
        .innerJoin(Project, 'project', 'scan.project_id = project.project_id')
        .leftJoin(A11yIssue, 'issue', 'scan.scan_id = issue.scan_id')
        .where('project.org_id = :orgId', { orgId })
        .select([
          'scan.scan_id AS scan_id',
          'scan.project_id AS project_id',
          'project.project_name AS project_name',
          'project.target_url AS target_url',
          'scan.overall_score AS overall_score',
          'scan.finished_at AS finished_at',
          'scan.status AS status',
        ])
        .addSelect('COUNT(issue.issue_id)', 'total_issues')
        .addSelect(
          "SUM(CASE WHEN issue.severity = 'critical' THEN 1 ELSE 0 END)",
          'critical_issues',
        )
        .groupBy('scan.scan_id')
        .addGroupBy('project.project_id')
        .addGroupBy('project.project_name')
        .addGroupBy('project.target_url')
        .orderBy('scan.finished_at', 'DESC')
        .getRawMany<RawHistoryResult>(); // 타입 단언

      // 3. 타입이 명시된 데이터를 안전하게 가공하여 반환
      return rawResults.map((item: RawHistoryResult) => ({
        ...item,
        overall_score: Number(item.overall_score || 0),
        total_issues: Number(item.total_issues || 0),
        critical_issues: Number(item.critical_issues || 0),
      }));
    } catch (error) {
      console.error('[historyReporting Error]', error);
      throw new InternalServerErrorException(
        '리포트 목록을 불러오는 중 오류가 발생했습니다.',
      );
    }
  }
  async getReportDetail(scanId: string) {
    try {
      // 1. 스캔 세션 정보와 프로젝트 정보를 조인해서 가져옴
      const session = await this.scanRepository.findOne({
        where: { scan_id: scanId },
        relations: ['project'], // 프로젝트 정보(이름, URL 등) 조인
      });

      if (!session) {
        throw new NotFoundException('리포트를 찾을 수 없습니다.');
      }

      // 2. 해당 스캔에 포함된 모든 위반 사항(Issues) 조회
      const issues = await this.issueRepository.find({
        where: { scan_id: scanId },
        order: { severity: 'DESC' }, // 치명적인 것부터 정렬
      });

      // 3. 프론트엔드 상세 페이지 형식을 맞춘 데이터 반환
      return {
        scan_id: session.scan_id,
        project_name: session.project?.project_name,
        target_url: session.target_url || session.project?.target_url,
        overall_score: session.overall_score,
        finished_at: session.finished_at,
        issues: issues, // 이슈 리스트 포함

      };
    } catch (error) {
      console.error('[getReportDetail Error]', error);
      throw new InternalServerErrorException('리포트 상세 조회 중 오류가 발생했습니다.');
    }
  }
}
