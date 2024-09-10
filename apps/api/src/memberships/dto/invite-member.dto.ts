import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { Role } from '@prisma/client';

export class InviteMemberDto {
  @IsEmail()
  email!: string;

  @IsEnum(Role)
  role!: Role;

  @IsOptional()
  @IsString()
  displayName?: string;
}
