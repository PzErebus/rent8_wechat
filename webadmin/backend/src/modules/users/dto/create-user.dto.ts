import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ description: '用户昵称', example: '张三' })
  @IsString()
  @IsNotEmpty({ message: '昵称不能为空' })
  nickname: string;

  @ApiProperty({ description: '手机号', example: '13800138000' })
  @IsString()
  @IsNotEmpty({ message: '手机号不能为空' })
  phone: string;

  @ApiProperty({ description: '用户类型', example: 'TRIAL', enum: ['TRIAL', 'FORMAL'] })
  @IsEnum(['TRIAL', 'FORMAL'])
  userType: 'TRIAL' | 'FORMAL';

  @ApiProperty({ description: '状态', example: 'ACTIVE', enum: ['ACTIVE', 'EXPIRED', 'DISABLED'] })
  @IsEnum(['ACTIVE', 'EXPIRED', 'DISABLED'])
  status: 'ACTIVE' | 'EXPIRED' | 'DISABLED';

  @ApiPropertyOptional({ description: '备注', example: 'VIP客户' })
  @IsString()
  @IsOptional()
  remark?: string;
}
