import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Project } from './entities/projects.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GetProjectsQueryDto } from './dto/get-projects-query.dto';
import { SaveProjectDto } from './dto/save-projects-query.dto';
import { Organization } from '@/organizations/entities/organization.entity';
import { ScanSession } from '@/scans/entities/scan-session.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(ScanSession)
    private readonly scanSessionRepository: Repository<ScanSession>,
  ) {}

  /**
   * 프로젝트 목록조회
   */
  async projectsAll(queryDto: GetProjectsQueryDto) {
    try {
      const { page = 1, limit = 5, keyword } = queryDto;
      const skip = (page - 1) * limit;

      const queryBuilder = this.projectRepository
        .createQueryBuilder('proj')
        .leftJoinAndSelect('proj.organization', 'org');

      queryBuilder.distinctOn(['proj.org_id']);

      if (keyword) {
        queryBuilder.andWhere('proj.project_name ILIKE :keyword', {
          keyword: `%${keyword}%`,
        });
      }

      const [items, total] = await queryBuilder
        .orderBy('proj.org_id', 'ASC')
        .addOrderBy('proj.created_at', 'DESC')
        .skip(skip)
        .take(limit)
        .getManyAndCount();

      return {
        data: items,
        meta: {
          total,
          page,
          last_page: total === 0 ? 1 : Math.ceil(total / limit),
        },
      };
    } catch (error) {
      //  error 미사용 경고 해결 및 디버깅을 위한 콘솔 로그 추가
      console.error('[projectsAll Error]', error);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        '목록 조회 중 서버 에러가 발생했습니다.',
      );
    }
  }

  /**
   * 프로젝트 상세조회
   */
  async findByOrg(orgId: string) {
    //  TS7043: any 타입 방지를 위해 명시적으로 Project[] 타입 선언
    let proj: Project[];

    try {
      proj = await this.projectRepository.find({
        where: {
          organization: { org_id: orgId },
          delete_yn: 'N',
        },
        relations: ['organization'],
        order: { created_at: 'DESC' },
      });
    } catch (error) {
      //  error 미사용 경고 해결
      console.error('[findByOrg Error]', error);
      throw new InternalServerErrorException(
        '상세 조회 중 서버 에러가 발생했습니다.',
      );
    }

    if (!proj || proj.length === 0) {
      throw new NotFoundException(
        `해당 ID(${orgId})의 프로젝트를 찾을 수 없습니다.`,
      );
    }
    return proj;
  }

  /**
   * 스캔 프로젝트 상세조회
   */
  async findScanByOrg(orgId: string) {
    //  TS7043: any 타입 방지를 위해 명시적으로 Project[] 타입 선언
    let proj: Project[];

    try {
      proj = await this.projectRepository.find({
        where: {
          organization: { org_id: orgId },
          delete_yn: 'N',
          display_yn: 'Y',
        },
        relations: ['organization'],
        order: { created_at: 'DESC' },
      });
    } catch (error) {
      //  error 미사용 경고 해결
      console.error('[findByOrg Error]', error);
      throw new InternalServerErrorException(
        '상세 조회 중 서버 에러가 발생했습니다.',
      );
    }

    if (!proj || proj.length === 0) {
      throw new NotFoundException(
        `해당 ID(${orgId})의 프로젝트를 찾을 수 없습니다.`,
      );
    }

    return Promise.all(
      //  TS7044: project 파라미터가 any가 되지 않도록 Project 타입 명시
      proj.map(async (project: Project) => {
        const latestScan = await this.scanSessionRepository.findOne({
          where: { project_id: project.project_id },
          order: { created_at: 'DESC' },
        });

        return {
          ...project,
          status: latestScan ? latestScan.status : 'IDLE',
          last_scan_id: latestScan ? latestScan.scan_id : undefined,
          last_scan_date: latestScan
            ? latestScan.finished_at || latestScan.started_at
            : undefined,
          last_score: latestScan ? latestScan.overall_score : undefined,
        };
      }),
    );
  }
  /**
   * 프로젝트 수정 및 생성 (Upsert)
   */
  async upsertProjects(dto: SaveProjectDto) {
    try {
      const { org_id, base_url, project_title, items } = dto;

      return await this.projectRepository.manager.transaction(
        async (manager) => {
          await manager.update(Organization, { org_id }, { base_url });

          let hasCreated = false;
          console.log('접근확인용');

          //  미사용 results 배열 삭제 완료

          for (const item of items) {
            if (!item.project_id) {
              delete item.project_id;
              hasCreated = true;
            }

            const projectData = {
              ...item,
              project_title,
              organization: { org_id: org_id },
            };

            // results.push() 없이 저장만 실행
            await manager.save(Project, projectData);
          }

          return {
            success: true,
            action: hasCreated ? 'created' : 'updated',
            message: hasCreated
              ? '성공적으로 등록되었습니다.'
              : '성공적으로 수정되었습니다.',
          };
        },
      );
    } catch (error) {
      console.error('Upsert Error:', error);

      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        '저장 및 수정 중 서버 에러가 발생했습니다.',
      );
    }
  }
}
