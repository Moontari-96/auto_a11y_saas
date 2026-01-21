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
@ApiTags('award')
@Public()
@Controller('scans')
export class ScansController {
  constructor(private readonly scansService: ScansService) {}

  @Post()
  async createScan(@Body('url') url: string) {
    console.log(url);
    // 간단한 유효성 검사 (공공기관 표준 준수를 위한 첫 단계)
    if (!url || !url.startsWith('http')) {
      throw new BadRequestException('올바른 URL 형식이 아닙니다.');
    }
    // URL 서비스 전달
    const res = await this.scansService.requestScanToWorker(url);
  }
}
