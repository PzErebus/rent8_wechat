import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateRoomDto {
  @ApiProperty({ example: '301', description: '房间号', required: false })
  @IsString()
  @IsOptional()
  roomNumber?: string;

  @ApiProperty({ example: 3, description: '楼层', required: false })
  @IsNumber()
  @IsOptional()
  @Min(1)
  floor?: number;

  @ApiProperty({ example: 45, description: '面积(㎡)', required: false })
  @IsNumber()
  @IsOptional()
  @Min(1)
  area?: number;

  @ApiProperty({ example: 1500, description: '租金(元/月)', required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  rent?: number;

  @ApiProperty({ example: 'available', description: '状态: available/rented', required: false })
  @IsString()
  @IsOptional()
  status?: 'available' | 'rented';

  @ApiProperty({ example: '张三', description: '租客姓名', required: false })
  @IsString()
  @IsOptional()
  tenantName?: string;

  @ApiProperty({ example: '13800138000', description: '租客电话', required: false })
  @IsString()
  @IsOptional()
  tenantPhone?: string;
}
