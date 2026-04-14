import { IsOptional, IsUUID } from 'class-validator';

export class LinkSessionDto {
  @IsOptional()
  @IsUUID()
  organizationId?: string;
}
