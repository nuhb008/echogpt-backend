import { IsInt, IsNumber, IsString, Min } from 'class-validator';

export class CreatePlanDto {
  @IsString()
  name!: string;

  @IsInt()
  @Min(1)
  monthlyLimit!: number;

  @IsNumber()
  @Min(0)
  price!: number;
}
