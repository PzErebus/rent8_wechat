import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LandlordService } from './landlord.service';
import { LandlordAuthGuard } from './guards/landlord-auth.guard';
import { WechatLoginDto } from './dto/wechat-login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('房东小程序')
@Controller('landlord')
export class LandlordController {
  constructor(private landlordService: LandlordService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '微信登录' })
  async wechatLogin(@Body() dto: WechatLoginDto) {
    const result = await this.landlordService.wechatLogin(dto.code);
    return {
      code: 1,
      data: result,
      msg: result.isNew ? '新用户，请注册' : '登录成功',
    };
  }

  @Post('register')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '用户注册' })
  async register(@Body() dto: RegisterDto) {
    const result = await this.landlordService.register(
      dto.openid,
      dto.phone,
      dto.nickname,
    );
    return {
      code: 1,
      data: result,
      msg: '注册成功',
    };
  }

  @Get('info')
  @UseGuards(LandlordAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取用户信息' })
  async getUserInfo(@Request() req) {
    const userId = req.user.userId;
    const result = await this.landlordService.getUserInfo(userId);
    return {
      code: 1,
      data: result,
      msg: 'success',
    };
  }

  @Post('update')
  @UseGuards(LandlordAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新用户信息' })
  async updateUser(@Request() req, @Body() dto: UpdateUserDto) {
    const userId = req.user.userId;
    const result = await this.landlordService.updateUser(userId, dto);
    return {
      code: 1,
      data: result,
      msg: '更新成功',
    };
  }
}
