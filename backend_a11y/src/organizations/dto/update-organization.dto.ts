import { PartialType } from '@nestjs/swagger';
import { CreateOrganizationDto } from './create-organization.dto';
import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class UpdateOrganizationDto extends PartialType(CreateOrganizationDto) {}
