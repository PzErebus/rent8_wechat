import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class WechatLoginDto {
  @ApiProperty({ description: '微信登录凭证code', example: 'xxx' })
  @IsString()
  @IsNotEmpty({ message: 'code不能为空' })
  code: string;
}
