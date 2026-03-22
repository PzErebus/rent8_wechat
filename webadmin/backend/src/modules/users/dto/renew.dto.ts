import { IsInt, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RenewDto {
  @ApiProperty({ description: '续费时长（月）', example: 12 })
  @IsInt()
  @Min(1)
  duration: number;

  @ApiProperty({ description: '金额', example: 299 })
  @IsNumber()
  @Min(0)
  amount: number;
}
