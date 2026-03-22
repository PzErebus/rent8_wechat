import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional, IsEnum, Min } from 'class-validator';

export class CreateBillDto {
  @ApiProperty({ example: 1, description: '房间ID' })
  @IsNumber()
  roomId: number;

  @ApiProperty({ example: 'rent', description: '账单类型: rent/water/electric' })
  @IsEnum(['rent', 'water', 'electric', 'property', 'gas', 'other'])
  type: 'rent' | 'water' | 'electric' | 'property' | 'gas' | 'other';

  @ApiProperty({ example: 1500, description: '金额' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ example: '2026-03', description: '月份' })
  @IsString()
  month: string;

  @ApiProperty({ required: false, description: '备注' })
  @IsString()
  @IsOptional()
  remark?: string;
}
