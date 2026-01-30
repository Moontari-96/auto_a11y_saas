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
   * 고객사 등록 (POST)
   */
  async create(createDto: CreateOrganizationDto) {
    // 1. DTO 데이터를 바탕으로 엔티티 객체 생성 (메모리 상에 생성)
    const newOrg = this.organizationRepository.create(createDto);

    // 2. DB에 저장
    return await this.organizationRepository.save(newOrg);
  }

  /**
   * 고객사 전체 목록 조회 (DTO 기반 페이징/검색)
   */
  async organizationAll(queryDto: GetOrganizationsQueryDto) {
    try {
      const { page = 1, limit = 10, keyword } = queryDto;
      const skip = (page - 1) * limit;

      const queryBuilder =
        this.organizationRepository.createQueryBuilder('org');

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
   * 고객사 정보 수정 (PATCH)
   */
  async update(id: string, updateDto: UpdateOrganizationDto) {
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
  }
}
