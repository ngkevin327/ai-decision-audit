import { ArrayNotEmpty, IsArray, IsOptional, IsString, IsUUID, IsIn } from 'class-validator';

const API_KEY_SCOPES = ['trace:ingest', 'trace:read', 'export:create'] as const;

export class CreateApiKeyDto {
  @IsString()
  name!: string;

  @IsUUID()
  projectId!: string;

  @IsOptional()
  @IsUUID()
  environmentId?: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsIn(API_KEY_SCOPES, { each: true })
  scopes!: string[];
}
