import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ description: '微信openid', example: 'xxx' })
  @IsString()
  @IsNotEmpty({ message: 'openid不能为空' })
  openid: string;

  @ApiProperty({ description: '手机号', example: '13800138000' })
  @IsString()
  @IsNotEmpty({ message: '手机号不能为空' })
  phone: string;

  @ApiProperty({ description: '昵称', example: '张房东', required: false })
  @IsString()
  @IsOptional()
  nickname?: string;
}
