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
import { OrganizationsService } from '@/organizations/organizations.service';
import { Organization } from '@/organizations/entities/organization.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    private readonly orgService: OrganizationsService, // 💡 주입
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
        .leftJoinAndSelect('proj.organization', 'org'); // 고객사 정보를 같이 가져오도록 추가;

      // org_id 기준 유니크한 프로젝트만 가져오고 싶을 때
      queryBuilder.distinctOn(['proj.org_id']);

      if (keyword) {
        queryBuilder.andWhere('proj.project_name ILIKE :keyword', {
          keyword: `%${keyword}%`,
        });
      }

      const [items, total] = await queryBuilder
        // 1. DISTINCT ON에 사용한 컬럼을 ORDER BY의 맨 앞에 배치해야 합니다.
        .orderBy('proj.org_id', 'ASC')
        // 2. 그 다음 기준으로 우리가 원했던 생성일 순 정렬을 넣습니다.
        .addOrderBy('proj.created_at', 'DESC')
        .skip(skip)
        .take(limit)
        .getManyAndCount();

      return {
        data: items,
        meta: {
          total,
          page,
          // total이 0이면 최소 1페이지를 반환하도록 수정
          last_page: total === 0 ? 1 : Math.ceil(total / limit),
        },
      };
    } catch (error) {
      // 이미 던져진 NestJS 내장 예외는 그대로 던지고, 나머지는 500 에러로 처리
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        '상세 조회 중 서버 에러가 발생했습니다.',
      );
    }
  }

  /**
   * 프로젝트 상세조회
   */
  async findByOrg(orgId: string) {
    // 상세조회
    try {
      const proj = await this.projectRepository.find({
        where: {
          org_id: orgId,
          delete_yn: 'N',
          display_yn: 'Y',
        },
        relations: ['organization'],
        order: { created_at: 'DESC' }, // 최신순 정렬
      });

      // 데이터가 없는 경우 404 에러를 던짐
      if (!proj) {
        throw new NotFoundException(
          `해당 ID(${orgId})의 프로젝트를 찾을 수 없습니다.`,
        );
      }

      return proj;
    } catch (error) {
      // 이미 던져진 NestJS 내장 예외는 그대로 던지고, 나머지는 500 에러로 처리
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        '상세 조회 중 서버 에러가 발생했습니다.',
      );
    }
  }

  /**
   * 프로젝트 수정 및 생성 (Upsert)
   */
  async upsertProjects(dto: SaveProjectDto) {
    try {
      const { org_id, base_url, project_title, items } = dto;

      // manager.transaction을 통해 하나의 트랜잭션으로 관리
      return await this.projectRepository.manager.transaction(
        async (manager) => {
          // 1. 고객사의 base_url 업데이트
          // 직접 manager를 사용하여 Organization 테이블 수정
          await manager.update(Organization, { org_id }, { base_url });
          // 2. 프로젝트 리스트 Upsert
          let hasCreated = false; // 신규 생성 여부 체크용 플래그
          console.log('접근확인용');
          const results: Project[] = [];
          for (const item of items) {
            // 핵심: 신규 항목이면 project_id 필드 자체를 제거합니다.
            if (!item.project_id) {
              delete item.project_id;
              hasCreated = true;
            }

            const projectData = {
              ...item,
              project_title,
              organization: { org_id: org_id }, //  관계 객체 형태로 전달,
            };

            // 이제 project_id가 없는 데이터는 정상적으로 INSERT 됩니다.
            const saved = await manager.save(Project, projectData);
            results.push(saved);
          }

          return {
            success: true,
            action: hasCreated ? 'created' : 'updated',
            message: hasCreated
              ? '성공적으로 등록되었습니다.'
              : '성공적으로 수정되었습니다.',
          };
        },
      ); // 💡 트랜잭션 종료 괄호 확인
    } catch (error) {
      console.error('Upsert Error:', error); // 에러 로그 확인용

      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        '저장 및 수정 중 서버 에러가 발생했습니다.',
      );
    }
  }
}
