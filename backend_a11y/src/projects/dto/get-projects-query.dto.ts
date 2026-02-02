import {
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsUUID,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class GetProjectsQueryDto {
  @ApiProperty({ description: '프로젝트 고유 ID (UUID)', required: false })
  @IsOptional()
  @IsUUID() // UUID 형식인지 유효성 검사 (추천)
  project_id?: string; // number에서 string으로 변경!

  @ApiProperty({ description: '고객사 고유 ID (UUID)', required: false })
  @IsOptional()
  @IsUUID() // UUID 형식인지 유효성 검사 (추천)
  org_id?: string; // number에서 string으로 변경!

  @ApiProperty({ description: '프로젝트 제목', required: false })
  @IsOptional()
  @IsString()
  project_title?: string;

  @ApiProperty({ description: '프로젝트 이름', required: false })
  @IsOptional()
  @IsString()
  project_name?: string;

  @ApiProperty({ description: '프로젝트 검사 URL', required: false })
  @IsOptional()
  @IsString()
  target_url?: string;

  @ApiProperty({ description: '프로젝트 생성일', required: false })
  @IsOptional()
  @IsDateString()
  created_at?: string;

  @ApiProperty({ description: '프로젝트 수정일', required: false })
  @IsOptional()
  @IsDateString()
  updated_at?: string;

  @ApiProperty({ description: '프로젝트 삭제여부', required: false })
  @IsOptional()
  @IsEnum(['Y', 'N']) // 다른 글자가 들어오면 에러!
  delete_yn?: string;

  // 페이징 처리를 위해 보통 추가하는 필드들
  @ApiProperty({ description: '페이지 수', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @ApiProperty({ description: '최대치', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 5;

  @ApiProperty({ description: '검색어', required: false })
  @IsOptional()
  @IsString()
  keyword?: string; // 검색어
}
