import { Body, Controller, Param, Patch, Post } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Public } from '@/auth/public.decorator';
import { GetProjectsQueryDto } from './dto/get-projects-query.dto';
import { SaveProjectDto } from './dto/save-projects-query.dto';
@Public()
@ApiTags('Project')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @ApiOperation({
    summary: '프로젝트 목록 조회',
    description: '조회 조건에 맞는 프로젝트 목록을 조회합니다',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 5 })
  @ApiQuery({
    name: 'keyword',
    required: false,
    description: '프로젝트 명칭 검색',
  })
  @Post('projectsAll')
  async projectAll(@Body() queryDto: GetProjectsQueryDto) {
    try {
      const result = await this.projectsService.projectsAll(queryDto);
      return {
        success: true,
        ...result,
        message: '목록 조회를 성공했습니다.',
      };
    } catch (error) {
      return {
        success: false,
        message: '목록 조회 중 오류가 발생했습니다.',
        error: error.message,
      };
    }
  }

  @ApiOperation({
    summary: '프로젝트 상세 조회',
    description: '조회 조건에 맞는 프로젝트 목록을 조회합니다',
  })
  @ApiQuery({
    name: 'orgId',
    required: true,
    description: '고객사 UUID',
  })
  @Post('findAllByOrg/:orgId')
  async findAllByOrg(@Param('orgId') orgId: string) {
    try {
      const result = await this.projectsService.findByOrg(orgId);
      return {
        success: true,
        data: result,
        message: '프로젝트 상세 조회를 성공했습니다.',
      };
    } catch (error) {
      return {
        success: false,
        message: '프로젝트 상세 조회 중 오류가 발생했습니다.',
        error: error.message,
      };
    }
  }

  @ApiOperation({
    summary: '프로젝트 수정',
    description: '프로젝트 목록을 수정합니다',
  })
  @Patch('updateProj')
  async updateProj(@Body() saveDto: SaveProjectDto) {
    try {
      console.log('접근확인', saveDto);
      const result = await this.projectsService.upsertProjects(saveDto);
      return {
        success: true,
        data: result,
        message: '프로젝트 수정을 성공했습니다.',
      };
    } catch (error) {
      return {
        success: false,
        message: '프로젝트 상세 조회 중 오류가 발생했습니다.',
        error: error.message,
      };
    }
  }
}
