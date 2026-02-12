import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class ProjectItemDto {
  @ApiProperty({ description: '프로젝트 고유 ID (UUID)', required: false })
  @IsOptional()
  @IsUUID()
  project_id?: string;

  @ApiProperty({ description: '페이지 명칭' })
  @IsString()
  project_name: string;

  @ApiProperty({ description: 'Target URL' })
  @IsString()
  target_url: string;

  @ApiProperty({ description: '노출 여부', default: 'Y' })
  @IsOptional()
  @IsEnum(['Y', 'N'])
  display_yn?: string = 'Y';

  @ApiProperty({ description: '삭제 여부', default: 'N' })
  @IsOptional()
  @IsEnum(['Y', 'N'])
  delete_yn?: string = 'N';
}
