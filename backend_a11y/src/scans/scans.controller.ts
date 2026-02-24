import {
  Controller,
  Get,
  Param,
  Post,
  BadRequestException,
  Body,
} from '@nestjs/common';
import { ScansService } from './scans.service';
import { Public } from '@/auth/public.decorator';
import { ApiConsumes, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
@Public()
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
    const { orgId, targets } = data;
    const scanResults: { projectId: string; scanId: string; status: string }[] =
      [];

    for (const target of targets) {
      try {
        const scanId = await this.scansService.requestScanToWorker(
          target.url,
          target.projectId,
          orgId,
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
}
