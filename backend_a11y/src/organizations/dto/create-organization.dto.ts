import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateOrganizationDto {
  @IsNotEmpty()
  @IsString()
  org_name: string;

  @IsOptional()
  @IsString()
  business_number: string;

  @IsOptional()
  @IsString()
  base_url: string;
}
