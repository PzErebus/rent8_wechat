import { Controller, Post, Body, HttpCode, HttpStatus, Ip } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';

@ApiTags('认证')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '管理员登录' })
  @ApiResponse({ status: 200, description: '登录成功', type: LoginResponseDto })
  @ApiResponse({ status: 401, description: '登录失败' })
  async login(@Body() loginDto: LoginDto, @Ip() ip: string) {
    loginDto.ip = ip;
    return this.authService.adminLogin(loginDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '刷新Token' })
  async refresh(@Body('refresh_token') refreshToken: string) {
    const payload = this.authService.verifyToken(refreshToken);
    if (!payload) {
      return {
        code: 401,
        message: '刷新令牌无效',
      };
    }

    const newPayload = {
      sub: payload.sub,
      username: payload.username,
      role: payload.role,
      type: payload.type,
    };

    return {
      access_token: this.authService.generateToken(newPayload),
    };
  }
}
