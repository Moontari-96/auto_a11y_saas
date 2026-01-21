import { Injectable, NotFoundException } from '@nestjs/common';
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
    const { page = 1, limit = 10, keyword } = queryDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.organizationRepository.createQueryBuilder('org');

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
        last_page: Math.ceil(total / limit),
      },
    };
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
