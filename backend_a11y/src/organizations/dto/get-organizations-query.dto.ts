import {
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsUUID,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class GetOrganizationsQueryDto {
  @IsOptional()
  @IsUUID() // UUID 형식인지 유효성 검사 (추천)
  org_id?: string; // number에서 string으로 변경!

  @IsOptional()
  @IsString()
  org_name?: string;

  @IsOptional()
  @IsString()
  business_number?: string;

  @IsOptional()
  @IsDateString()
  created_at?: string;

  @IsOptional()
  @IsDateString()
  updated_at?: string;

  @IsOptional()
  @IsString() // 보통 URL 쿼리에서는 'Y', 'N' 문자열로 많이 처리해
  delete_yn?: string;

  // 페이징 처리를 위해 보통 추가하는 필드들
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 10;

  @IsOptional()
  @IsString()
  keyword?: string; // 검색어
}
