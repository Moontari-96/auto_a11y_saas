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
  @Get('organizationAll') // 엔드포인트는 보통 클래스 레벨의 @Controller('organizations')를 따릅니다.
  async organizationAll(@Query() query: GetOrganizationsQueryDto) {
    // 숫자로 확실히 변환하여 서비스로 전달
    return this.organizationsService.organizationAll(query);
  }
}
