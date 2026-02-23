import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from './entities/organization.entity';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { GetOrganizationsQueryDto } from './dto/get-organizations-query.dto';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
  ) {}

  /**
   * 고객사 전체 목록 조회 (DTO 기반 페이징/검색)
   */
  async organizationAll(queryDto: GetOrganizationsQueryDto) {
    try {
      const { page = 1, limit = 10, keyword } = queryDto;
      const skip = (page - 1) * limit;

      const queryBuilder = this.organizationRepository
        .createQueryBuilder('org')
        .where('org.delete_yn = :deleteYn', { deleteYn: 'N' });
      if (keyword) {
        queryBuilder.andWhere('org.org_name ILIKE :keyword', {
          keyword: `%${keyword}%`,
        });
      }

      const [items, total] = await queryBuilder
        .orderBy('org.created_at', 'DESC')
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
   * 고객사 상세조회
   */
  async findOne(org_id: string) {
    // 상세조회
    try {
      const org = await this.organizationRepository.findOne({
        // 1. 필요한 컬럼만 리스트업
        select: ['org_id', 'org_name', 'business_number', 'base_url'], // 추가!
        where: { org_id },
      });

      // 데이터가 없는 경우 404 에러를 던짐
      if (!org) {
        throw new NotFoundException(
          `해당 ID(${org_id})의 고객사를 찾을 수 없습니다.`,
        );
      }

      return org;
    } catch (error) {
      // 이미 던져진 NestJS 내장 예외는 그대로 던지고, 나머지는 500 에러로 처리
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        '상세 조회 중 서버 에러가 발생했습니다.',
      );
    }
  }

  /**
   * 고객사 정보 등록
   */
  async createOrg(dto: CreateOrganizationDto) {
    try {
      // 1. 엔티티 인스턴스 생성 (메모리상)
      const newOrg = this.organizationRepository.create(dto);

      // 2. 실제로 DB에 저장 (INSERT 쿼리 실행)
      return await this.organizationRepository.save(newOrg);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        '고객사 정보 등록 중 에러가 발생했습니다.',
      );
    }
  }

  /**
   * 고객사 정보 수정
   */
  async updateOrg(id: string, updateDto: UpdateOrganizationDto) {
    try {
      // 1. 존재 여부 확인
      const org = await this.organizationRepository.preload({
        org_id: id,
        ...updateDto,
      });

      if (!org) {
        throw new NotFoundException(
          `수정할 고객사를 찾을 수 없습니다. (ID: ${id})`,
        );
      }
      // 2. 변경된 내용 저장
      return await this.organizationRepository.save(org);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error('정보 수정 중 DB 에러:', error);
      throw new InternalServerErrorException(
        '고객사 정보 수정 중 에러가 발생했습니다.',
      );
    }
  }

  /**
   * 고객사 삭제
   */
  async deleteOrg(orgId: string) {
    try {
      const result = await this.organizationRepository.update(orgId, {
        delete_yn: 'Y',
      });

      //대상이 없어서 업데이트가 안 된 경우 (404)
      if (result.affected === 0) {
        throw new NotFoundException(
          `해당 ID(${orgId})의 고객사를 찾을 수 없습니다.`,
        );
      }

      return { success: true, message: '삭제되었습니다.' };
    } catch (error) {
      // 이미 던져진 404 에러는 그대로 통과
      if (error instanceof NotFoundException) throw error;

      // 그 외 DB 연결 문제 등 진짜 서버 에러 (500)
      console.error('삭제 중 DB 에러:', error);
      throw new InternalServerErrorException(
        '서버 내부 오류로 삭제에 실패했습니다.',
      );
    }
  }

  /**
   * 어떠한 프로젝트에도 등록되지 않은(FK가 잡히지 않은) 고객사만 조회
   */
  async selectAll() {
    try {
      const queryBuilder = this.organizationRepository
        .createQueryBuilder('org')
        // 서브쿼리: 프로젝트 테이블에 존재하는 모든 org_id를 가져옴
        .where((qb) => {
          const subQuery = qb
            .subQuery()
            .select('proj.org_id')
            .from('projects', 'proj')
            .where('proj.org_id IS NOT NULL')
            .getQuery();
          return 'org.org_id NOT IN ' + subQuery;
        })
        // 삭제되지 않은 상태 조건 추가
        .andWhere('org.delete_yn = :deleteYn', { deleteYn: 'N' });

      const availableOrgs = await queryBuilder.getMany();

      return {
        success: true,
        data: availableOrgs,
      };
    } catch (error) {
      console.error('미등록 고객사 조회 중 에러:', error);
      throw new InternalServerErrorException(
        '고객사 목록을 불러오는 중 오류가 발생했습니다.',
      );
    }
  }

  /**
   * 검사용 고객사 조회
   */
  async scanSelectAll() {
    try {
      const queryBuilder = this.organizationRepository
        .createQueryBuilder('org')
        // 삭제되지 않은 상태 조건 추가
        .andWhere('org.delete_yn = :deleteYn', { deleteYn: 'N' });
      const availableOrgs = await queryBuilder.getMany();
      return {
        success: true,
        data: availableOrgs,
      };
    } catch (error) {
      console.error('미등록 고객사 조회 중 에러:', error);
      throw new InternalServerErrorException(
        '고객사 목록을 불러오는 중 오류가 발생했습니다.',
      );
    }
  }
}
