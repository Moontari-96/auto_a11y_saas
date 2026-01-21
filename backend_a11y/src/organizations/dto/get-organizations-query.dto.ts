import { IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class GetOrganizationsQueryDto {
  @IsOptional()
  @Type(() => Number) // 쿼리 스트링(문자열)을 숫자로 변환
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 10;

  @IsOptional()
  @IsString()
  keyword?: string;
}
