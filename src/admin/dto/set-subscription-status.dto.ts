import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { SubscriptionStatus } from '../../common/enums/index.js';

export class SetSubscriptionStatusDto {
  @ApiProperty({ enum: SubscriptionStatus, example: SubscriptionStatus.CANCELLED })
  @IsEnum(SubscriptionStatus)
  status: SubscriptionStatus;
}
