import {
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsUUID,
  IsDateString,
  IsEnum,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ProjectItemDto } from './project-item.dto';

export class SaveProjectDto {
  @ApiProperty({ description: '고객사 ID (UUID)' })
  @IsUUID()
  org_id: string;

  @ApiProperty({
    description: '고객사 기본 URL (Organizations 테이블 업데이트용)',
  })
  @IsString()
  base_url: string;

  @ApiProperty({ description: '프로젝트 대제목' })
  @IsString()
  project_title: string;

  @ApiProperty({
    description: '하위 페이지 목록 (배열)',
    type: [ProjectItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true }) // 💡 중요: 배열 내부의 각 객체도 검증하겠다는 선언
  @Type(() => ProjectItemDto) // 💡 중요: 클래스 변환을 위한 타입 지정
  items: ProjectItemDto[];
}
