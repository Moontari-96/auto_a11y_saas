import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { ScansService } from './scans.service';
import { Public } from '@/auth/public.decorator';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
@ApiTags('Scans')
@Controller('scans')
export class ScansController {
  constructor(private readonly scansService: ScansService) {}
  @ApiOperation({
    summary: '검사 URL 및 Project Id 전달',
    description: 'worker로 검사 요청을 보냅니다',
  })
  @Post('run')
  async runBulkScan(
    @Body()
    data: {
      orgId: string;
      targets: { projectId: string; url: string }[];
    },
  ) {
    const { targets } = data;
    const scanResults: { projectId: string; scanId: string; status: string }[] =
      [];

    for (const target of targets) {
      try {
        const scanId = await this.scansService.requestScanToWorker(
          target.url,
          target.projectId,
        );

        scanResults.push({
          projectId: target.projectId,
          scanId: scanId,
          status: 'PROGRESS', // 상태 전달
        });
      } catch (error) {
        console.error(`스캔 요청 실패: ${target.url}`, error);
      }
    }

    return {
      success: true,
      scans: scanResults,
    };
  }

  @ApiOperation({
    summary: '검사 상태 조회 풀링',
    description: '검사 상태 조회 풀링 엔드포인트',
  })
  @Get(':scanId')
  async getScanStatus(@Param('scanId') scanId: string) {
    // 서비스에 상태 조회 로직 위임
    const status = await this.scansService.getScanStatus(scanId);

    // 프론트엔드가 기대하는 { status: 'PROGRESS' } 형태로 응답
    return { status };
  }

  @ApiOperation({
    summary: '검사 상태 조회 풀링',
    description: '검사 상태 조회 풀링 엔드포인트',
  })
  @Get(':projectId')
  async findOne(@Param('projectId') projectId: string) {
    // 서비스에 상태 조회 로직 위임
    const status = await this.scansService.findOne(projectId);

    // 프론트엔드가 기대하는 { status: 'PROGRESS' } 형태로 응답
    return { status };
  }

  @ApiOperation({
    summary: '검사 내역 조회 리포팅',
    description: '검사 내역 조회 리포팅 엔드포인트',
  })
  @Get('historyReporting/:orgId')
  async historyReporting(@Param('orgId') orgId: string) {
    try {
      const result = await this.scansService.historyReporting(orgId);
      return {
        success: true,
        data: result,
        message: '검사내역 조회를 성공했습니다.',
      };
    } catch (error: unknown) {
      let errorMessage = '알 수 없는 오류가 발생했습니다.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      return {
        success: false,
        message: '검사내역 조회 중 오류가 발생했습니다.',
        error: errorMessage,
      };
    }
  }
  @ApiOperation({
    summary: '검사 내역 조회 리포팅',
    description: '검사 내역 조회 리포팅 엔드포인트',
  })
  @Get('getReportDetail/:scanId')
  async getReportDetail(@Param('scanId') scanId: string) {
    try {
      const result = await this.scansService.getReportDetail(scanId);
      return {
        success: true,
        data: result,
        message: '검사내역 상세 조회를 성공했습니다.',
      };
    } catch (error: unknown) {
      let errorMessage = '알 수 없는 오류가 발생했습니다.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      return {
        success: false,
        message: '검사내역 상세 조회 중 오류가 발생했습니다.',
        error: errorMessage,
      };
    }
  }
}
