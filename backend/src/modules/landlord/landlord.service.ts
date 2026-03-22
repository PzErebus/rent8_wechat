import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as dayjs from 'dayjs';
import { PrismaService } from '@/prisma/prisma.service';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class LandlordService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private httpService: HttpService,
    private authService: AuthService,
  ) {}

  // 微信登录
  async wechatLogin(code: string) {
    const appid = this.configService.get<string>('WECHAT_APPID');
    const secret = this.configService.get<string>('WECHAT_SECRET');

    // 调用微信接口获取openid
    const url = `https://api.weixin.qq.com/sns/jscode2session`;
    const params = {
      appid,
      secret,
      js_code: code,
      grant_type: 'authorization_code',
    };

    try {
      const response = await firstValueFrom(
        this.httpService.get(url, { params }),
      );
      const wxData = response.data;

      if (wxData.errcode) {
        throw new UnauthorizedException(`微信登录失败: ${wxData.errmsg}`);
      }

      const { openid, session_key } = wxData;

      if (!openid) {
        throw new UnauthorizedException('获取openid失败');
      }

      // 查询用户是否存在
      let user = await this.prisma.user.findUnique({
        where: { openid },
      });

      // 生成token
      const token = this.authService.generateToken({
        sub: user?.id || 0,
        openid,
        type: 'landlord',
      });

      if (!user) {
        // 新用户
        return {
          isNew: true,
          openid,
          sessionKey: session_key,
          token,
        };
      }

      // 检查用户状态
      if (user.status === 'DISABLED') {
        throw new UnauthorizedException('账号已被禁用');
      }

      // 检查是否过期
      const now = dayjs();
      let isExpired = false;

      if (user.userType === 'TRIAL' && user.trialEndAt) {
        isExpired = dayjs(user.trialEndAt).isBefore(now);
      } else if (user.userType === 'FORMAL' && user.formalEndAt) {
        isExpired = dayjs(user.formalEndAt).isBefore(now);
      }

      if (isExpired && user.status !== 'EXPIRED') {
        // 更新状态为过期
        await this.prisma.user.update({
          where: { id: user.id },
          data: { status: 'EXPIRED' },
        });
        user.status = 'EXPIRED';
      }

      // 更新登录信息
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          loginCount: { increment: 1 },
          lastLoginAt: new Date(),
        },
      });

      return {
        isNew: false,
        token,
        user: {
          id: user.id,
          nickname: user.nickname,
          avatar: user.avatar,
          phone: user.phone,
          userType: user.userType,
          status: user.status,
          trialEndAt: user.trialEndAt,
          formalEndAt: user.formalEndAt,
          roomCount: user.roomCount,
          tenantCount: user.tenantCount,
        },
      };
    } catch (error) {
      throw new UnauthorizedException(error.message || '微信登录失败');
    }
  }

  // 用户注册
  async register(openid: string, phone: string, nickname?: string) {
    // 检查用户是否已存在
    const existingUser = await this.prisma.user.findUnique({
      where: { openid },
    });

    if (existingUser) {
      throw new UnauthorizedException('用户已存在');
    }

    // 获取试用天数
    const trialDays = parseInt(
      (await this.getSetting('trial_days')) || '7',
    );

    const now = dayjs();
    const trialStartAt = now.toDate();
    const trialEndAt = now.add(trialDays, 'day').toDate();

    // 创建用户
    const user = await this.prisma.user.create({
      data: {
        openid,
        phone,
        nickname: nickname || `房东${phone.slice(-4)}`,
        userType: 'TRIAL',
        status: 'ACTIVE',
        trialStartAt,
        trialEndAt,
        loginCount: 1,
        lastLoginAt: new Date(),
      },
    });

    // 生成token
    const token = this.authService.generateToken({
      sub: user.id,
      openid,
      type: 'landlord',
    });

    return {
      token,
      user: {
        id: user.id,
        nickname: user.nickname,
        phone: user.phone,
        userType: user.userType,
        status: user.status,
        trialEndAt: user.trialEndAt,
        roomCount: 0,
        tenantCount: 0,
      },
    };
  }

  // 获取用户信息
  async getUserInfo(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    return {
      id: user.id,
      nickname: user.nickname,
      avatar: user.avatar,
      phone: user.phone,
      userType: user.userType,
      status: user.status,
      trialStartAt: user.trialStartAt,
      trialEndAt: user.trialEndAt,
      formalStartAt: user.formalStartAt,
      formalEndAt: user.formalEndAt,
      roomCount: user.roomCount,
      tenantCount: user.tenantCount,
      loginCount: user.loginCount,
      lastLoginAt: user.lastLoginAt,
    };
  }

  // 更新用户信息
  async updateUser(userId: number, data: { nickname?: string; avatar?: string }) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        nickname: data.nickname,
        avatar: data.avatar,
      },
    });

    return {
      id: user.id,
      nickname: user.nickname,
      avatar: user.avatar,
    };
  }

  // 获取系统设置
  private async getSetting(key: string): Promise<string | null> {
    const setting = await this.prisma.setting.findUnique({
      where: { key },
    });
    return setting?.value || null;
  }
}
