import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({ description: '用户昵称', example: '张三' })
  @IsString()
  @IsOptional()
  nickname?: string;

  @ApiPropertyOptional({ description: '手机号', example: '13800138000' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ description: '用户类型', example: 'TRIAL', enum: ['TRIAL', 'FORMAL'] })
  @IsEnum(['TRIAL', 'FORMAL'])
  @IsOptional()
  userType?: 'TRIAL' | 'FORMAL';

  @ApiPropertyOptional({ description: '状态', example: 'ACTIVE', enum: ['ACTIVE', 'EXPIRED', 'DISABLED'] })
  @IsEnum(['ACTIVE', 'EXPIRED', 'DISABLED'])
  @IsOptional()
  status?: 'ACTIVE' | 'EXPIRED' | 'DISABLED';

  @ApiPropertyOptional({ description: '备注', example: 'VIP客户' })
  @IsString()
  @IsOptional()
  remark?: string;
}
