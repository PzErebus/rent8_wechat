import { ApiProperty } from '@nestjs/swagger';

class AdminInfoDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  username: string;

  @ApiProperty()
  nickname: string;

  @ApiProperty()
  role: string;

  @ApiProperty()
  avatar: string;
}

export class LoginResponseDto {
  @ApiProperty()
  access_token: string;

  @ApiProperty()
  refresh_token: string;

  @ApiProperty({ type: AdminInfoDto })
  admin: AdminInfoDto;
}
