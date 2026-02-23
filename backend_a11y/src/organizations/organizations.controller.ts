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
  HttpCode,
} from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { ApiConsumes, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Public } from '@/auth/public.decorator';
import { GetOrganizationsQueryDto } from './dto/get-organizations-query.dto';

@Public()
@ApiTags('Organization')
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
  @HttpCode(200)
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
  @HttpCode(200)
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
    description: '고객사 UUID',
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

  @ApiOperation({
    summary: '고객사 수정',
    description: '고객사를 수정합니다.',
  })
  @ApiQuery({
    name: 'org_id',
    required: true,
    description: '고객사 UUID',
  })
  @Patch('updateOrg/:orgId') // 엔드포인트는 보통 클래스 레벨의 @Controller('organizations')를 따릅니다.
  async updateOrg(
    @Param('orgId') orgId: string,
    @Body() queryDto: UpdateOrganizationDto,
  ) {
    // 이제 JSON Body에 담긴 keyword를 읽을 수 있습니다.
    try {
      const data = await this.organizationsService.updateOrg(orgId, queryDto);

      return {
        success: true,
        message: '고객사 정보 수정을 완료했습니다.',
        data: data,
      };
    } catch (error) {
      // 에러 발생 시 규격
      return {
        success: false,
        message: '고객사 수정 중 오류가 발생했습니다.',
        error: error.message,
      };
    }
  }

  @ApiOperation({
    summary: '고객사 삭제',
    description: '고객사를 논리 삭제합니다.',
  })
  @ApiQuery({
    name: 'orgId',
    required: true,
    description: '고객사 UUID',
  })
  @Patch('deleteOrg/:orgId') // 엔드포인트는 보통 클래스 레벨의 @Controller('organizations')를 따릅니다.
  async deleteOrg(@Param('orgId') orgId: string) {
    // 이제 JSON Body에 담긴 keyword를 읽을 수 있습니다.
    try {
      console.log(orgId, '테스트 진행중');
      const data = await this.organizationsService.deleteOrg(orgId);
      return {
        success: true,
        message: '고객사 정보를 삭제했습니다',
        data: data,
      };
    } catch (error) {
      // 에러 발생 시 규격
      return {
        success: false,
        message: '고객사 삭제 중 오류가 발생했습니다.',
        error: error.message,
      };
    }
  }

  @ApiOperation({
    summary: '고객사 목록 셀렉트',
    description: '프로젝트에서 선택되지않은 고객사 목록 조회',
  })
  @Post('selectAll')
  @HttpCode(200) // POST지만 조회이므로 200 OK를 반환하도록 설정
  async selectAll(@Body() body: any) {
    // Body가 들어온다면 반드시 선언!
    try {
      const result = await this.organizationsService.selectAll();

      // result가 정상적인 객체인지 확인 후 전개
      return {
        success: true,
        message: '고객사 목록 셀렉트를 성공적으로 불러왔습니다.',
        data: result.data || result, // 구조에 따라 안전하게 처리
      };
    } catch (error) {
      console.error('컨트롤러 진입 후 에러:', error); // 진짜 에러 원인 파악용
      return {
        success: false,
        message: '목록 조회 중 오류가 발생했습니다.',
        error: error.message,
      };
    }
  }
  @ApiOperation({
    summary: '스캔용 고객사 목록 셀렉트',
    description: '스캔용 고객사 목록 조회',
  })
  @Post('scanSelectAll')
  @HttpCode(200) // POST지만 조회이므로 200 OK를 반환하도록 설정
  async scanSelectAll(@Body() body: any) {
    // Body가 들어온다면 반드시 선언!
    try {
      const result = await this.organizationsService.scanSelectAll();

      // result가 정상적인 객체인지 확인 후 전개
      return {
        success: true,
        message: '스캔용 고객사 목록 셀렉트를 성공적으로 불러왔습니다.',
        data: result.data || result, // 구조에 따라 안전하게 처리
      };
    } catch (error) {
      console.error('컨트롤러 진입 후 에러:', error); // 진짜 에러 원인 파악용
      return {
        success: false,
        message: '목록 조회 중 오류가 발생했습니다.',
        error: error.message,
      };
    }
  }
}
