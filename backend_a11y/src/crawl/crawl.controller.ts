import { Crawl } from './entities/crawl.entity';
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CrawlService } from './crawl.service';
import { CreateCrawlDto } from './dto/create-crawl.dto';
import { UpdateCrawlDto } from './dto/update-crawl.dto';
import axios from 'axios';
import { ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Public } from '@/auth/public.decorator';
@Public()
@ApiTags('Crawl')
@Controller('crawl')
export class CrawlController {
  constructor(private readonly crawlService: CrawlService) {}
  @ApiOperation({
    summary: '사이트 크롤링 요청',
    description: '입력된 URL 하위의 페이지 목록을 가져옵니다.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          example: 'https://projects.accesscomputing.uw.edu/au/index.html',
          description: '크롤링할 대상 URL',
        },
      },
      required: ['url'],
    },
  })
  @Post('getCrawling')
  async proxyCrawl(@Body() body: { url: string }) {
    // 1. 필요한 경우 여기서 유효성 검사
    if (!body.url.startsWith('http')) {
      throw new BadRequestException('올바른 URL 형식이 아닙니다.');
    }

    try {
      // 2. Worker 서버(Node.js)로 요청 전달
      // 환경변수에 WORKER_URL="http://localhost:4000" 설정 필요
      console.log(`${process.env.WORKER_URL}/crawl`, 'url 확인');
      const response = await axios.post(`${process.env.WORKER_URL}/crawl`, {
        url: body.url,
      });
      console.log('Worker Response:', response.data);
      const res = response.data;
      return {
        success: res.success,
        data: res.data, // [{url, title}, ...]
      };
    } catch (error) {
      // 에러의 정체를 밝히는 로그
      if (error.response) {
        // 서버가 응답을 보냈지만 4xx, 5xx 에러인 경우
        console.error(
          'Worker Response Error:',
          error.response.status,
          error.response.data,
        );
      } else if (error.request) {
        // 요청은 보냈으나 응답을 전혀 못 받은 경우 (포트 막힘 등)
        console.error('Worker No Response:', error.request);
      } else {
        console.error('Axios Setup Error:', error.message);
      }
      throw new InternalServerErrorException(
        `워커 서버 통신 오류: ${error.message}`,
      );
    }
  }
}
