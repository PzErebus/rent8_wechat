import { ApiProperty } from '@nestjs/swagger';

export class RoomQueryDto {
  @ApiProperty({ required: false, description: '页码' })
  page?: number = 1;

  @ApiProperty({ required: false, description: '每页数量' })
  pageSize?: number = 10;

  @ApiProperty({ required: false, description: '状态筛选: available/rented' })
  status?: 'available' | 'rented';

  @ApiProperty({ required: false, description: '楼层筛选' })
  floor?: number;

  @ApiProperty({ required: false, description: '关键词搜索(房号/租客)' })
  keyword?: string;
}
