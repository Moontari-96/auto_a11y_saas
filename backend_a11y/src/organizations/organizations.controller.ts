import { Organization } from './entities/organization.entity';
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { ApiConsumes, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Public } from '@/auth/public.decorator';
import { GetOrganizationsQueryDto } from './dto/get-organizations-query.dto';

@Public()
@ApiTags('organizations')
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @ApiOperation({
    summary: '고객사 목록 조회',
    description: '고객사 전체 목록을 최신순으로 페이징하여 조회합니다.',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({
    name: 'keyword',
    required: false,
    description: '고객사 명칭 검색',
  })
  @Post('organizationAll') // 엔드포인트는 보통 클래스 레벨의 @Controller('organizations')를 따릅니다.
  async organizationAll(@Body() queryDto: GetOrganizationsQueryDto) {
    // 이제 JSON Body에 담긴 keyword를 읽을 수 있습니다.
    try {
      // 1. 서비스에서 순수 데이터(items, meta)를 가져옴
      const result = await this.organizationsService.organizationAll(queryDto);
      // 2. 컨트롤러에서 공통 규격으로 감싸서 응답
      return {
        success: true,
        message: '고객사 목록을 성공적으로 불러왔습니다.',
        ...result, // 서비스가 리턴한 data, meta가 여기에 풀림
      };
    } catch (error) {
      // 에러 발생 시 규격
      return {
        success: false,
        message: '목록 조회 중 오류가 발생했습니다.',
        error: error.message,
      };
    }
  }

  @ApiOperation({
    summary: '고객사 상세 조회',
    description: '고객사를 상세 조회합니다.',
  })
  @ApiQuery({
    name: 'org_id',
    required: true,
    description: '고객사 UUID',
  })
  @Post('findOne') // 엔드포인트는 보통 클래스 레벨의 @Controller('organizations')를 따릅니다.
  async findOne(@Body('org_id') org_id: string) {
    try {
      // 고객사 상세 조회
      const data = await this.organizationsService.findOne(org_id);

      return {
        success: true,
        message: '고객사 정보를 성공적으로 불러왔습니다.',
        data: data,
      };
    } catch (error) {
      // 에러 발생 시 규격
      return {
        success: false,
        message: '목록 조회 중 오류가 발생했습니다.',
        error: error.message,
      };
    }
  }

  @ApiOperation({
    summary: '고객사 등록',
    description: '고객사를 등록합니다.',
  })
  @ApiQuery({
    name: 'org_id',
    required: true,
    description: '고객사 명칭 검색',
  })
  @Post('createOrg') // 엔드포인트는 보통 클래스 레벨의 @Controller('organizations')를 따릅니다.
  async createOrg(@Body() queryDto: CreateOrganizationDto) {
    // 이제 JSON Body에 담긴 keyword를 읽을 수 있습니다.
    try {
      const data = await this.organizationsService.createOrg(queryDto);

      return {
        success: true,
        message: '고객사 정보를 등록완료했습니다',
        data: data,
      };
    } catch (error) {
      // 에러 발생 시 규격
      return {
        success: false,
        message: '고객사 등록 중 오류가 발생했습니다.',
        error: error.message,
      };
    }
  }
}
