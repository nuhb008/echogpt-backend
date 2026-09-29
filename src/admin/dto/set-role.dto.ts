import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { RoleName } from '../../common/enums/index.js';

export class SetRoleDto {
  @ApiProperty({ enum: RoleName, example: RoleName.ADMIN })
  @IsEnum(RoleName)
  role: RoleName;
}
