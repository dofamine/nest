import { IsEnum, IsIn, IsOptional } from 'class-validator';
import { Role } from '../../../generated/prisma/enums.js';

export class ManageUserDto {
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsIn(['active', 'deactivated'])
  status?: 'active' | 'deactivated';
}
