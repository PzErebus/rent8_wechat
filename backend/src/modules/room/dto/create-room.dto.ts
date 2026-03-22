import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateRoomDto {
  @ApiProperty({ example: '301', description: '房间号' })
  @IsString()
  roomNumber: string;

  @ApiProperty({ example: 3, description: '楼层' })
  @IsNumber()
  @Min(1)
  floor: number;

  @ApiProperty({ example: 45, description: '面积(㎡)' })
  @IsNumber()
  @Min(1)
  area: number;

  @ApiProperty({ example: 1500, description: '租金(元/月)' })
  @IsNumber()
  @Min(0)
  rent: number;

  @ApiProperty({ example: '房东姓名', description: '房东姓名' })
  @IsString()
  @IsOptional()
  landlordName?: string;

  @ApiProperty({ example: '13800138000', description: '房东电话' })
  @IsString()
  @IsOptional()
  landlordPhone?: string;
}
