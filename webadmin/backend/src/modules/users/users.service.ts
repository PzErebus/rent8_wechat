import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import * as dayjs from 'dayjs';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // 获取用户列表
  async findAll(query: QueryUserDto) {
    const {
      page = 1,
      pageSize = 10,
      keyword,
      userType,
      status,
    } = query;

    const where: any = {};

    if (keyword) {
      where.OR = [
        { nickname: { contains: keyword } },
        { phone: { contains: keyword } },
      ];
    }

    if (userType) {
      where.userType = userType;
    }

    if (status) {
      where.status = status;
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    // 计算进度
    const list = users.map((user) => ({
      ...user,
      progress: this.calculateProgress(user),
    }));

    return {
      list,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  // 获取用户详情
  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return {
      ...user,
      progress: this.calculateProgress(user),
    };
  }

  // 创建用户
  async create(dto: CreateUserDto) {
    const now = dayjs();
    let trialStartAt = null;
    let trialEndAt = null;
    let formalStartAt = null;
    let formalEndAt = null;

    if (dto.userType === 'TRIAL') {
      trialStartAt = now.toDate();
      trialEndAt = now.add(7, 'day').toDate();
    } else {
      formalStartAt = now.toDate();
      formalEndAt = now.add(1, 'year').toDate();
    }

    const user = await this.prisma.user.create({
      data: {
        openid: `manual_${Date.now()}`,
        nickname: dto.nickname,
        phone: dto.phone,
        userType: dto.userType,
        status: dto.status,
        remark: dto.remark,
        trialStartAt,
        trialEndAt,
        formalStartAt,
        formalEndAt,
      },
    });

    return user;
  }

  // 更新用户
  async update(id: number, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const updateData: any = {
      nickname: dto.nickname,
      phone: dto.phone,
      status: dto.status,
      remark: dto.remark,
    };

    // 如果类型改变，更新日期
    if (dto.userType && dto.userType !== user.userType) {
      const now = dayjs();
      if (dto.userType === 'TRIAL') {
        updateData.trialStartAt = now.toDate();
        updateData.trialEndAt = now.add(7, 'day').toDate();
        updateData.formalStartAt = null;
        updateData.formalEndAt = null;
      } else {
        updateData.formalStartAt = now.toDate();
        updateData.formalEndAt = now.add(1, 'year').toDate();
        updateData.trialStartAt = null;
        updateData.trialEndAt = null;
      }
      updateData.userType = dto.userType;
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
    });
  }

  // 删除用户
  async remove(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    await this.prisma.user.delete({
      where: { id },
    });

    return { success: true };
  }

  // 用户续费
  async renew(id: number, duration: number, amount: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const now = dayjs();
    const baseDate = user.formalEndAt && dayjs(user.formalEndAt).isAfter(now)
      ? dayjs(user.formalEndAt)
      : now;
    const newEndAt = baseDate.add(duration, 'month').toDate();

    // 更新用户
    await this.prisma.user.update({
      where: { id },
      data: {
        userType: 'FORMAL',
        status: 'ACTIVE',
        formalStartAt: user.formalStartAt || now.toDate(),
        formalEndAt: newEndAt,
      },
    });

    // 创建订单
    const orderNo = `ORD${dayjs().format('YYYYMMDD')}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    await this.prisma.order.create({
      data: {
        orderNo,
        userId: id,
        packageType: 'FORMAL',
        duration,
        amount,
        payMethod: 'CASH',
        payStatus: 'SUCCESS',
        payAt: new Date(),
      },
    });

    return {
      orderNo,
      expireDate: newEndAt,
    };
  }

  // 获取即将到期用户
  async getExpiringUsers(days: number = 7) {
    const targetDate = dayjs().add(days, 'day').toDate();
    const now = new Date();

    return this.prisma.user.findMany({
      where: {
        userType: 'TRIAL',
        status: 'ACTIVE',
        trialEndAt: {
          lte: targetDate,
          gte: now,
        },
      },
      orderBy: {
        trialEndAt: 'asc',
      },
    });
  }

  // 计算进度
  private calculateProgress(user: any): number {
    const now = dayjs();

    if (user.userType === 'TRIAL' && user.trialStartAt && user.trialEndAt) {
      const start = dayjs(user.trialStartAt);
      const end = dayjs(user.trialEndAt);

      if (now.isAfter(end)) return 100;
      if (now.isBefore(start)) return 0;

      const total = end.diff(start);
      const used = now.diff(start);
      return Math.min(100, Math.round((used / total) * 100));
    }

    if (user.userType === 'FORMAL' && user.formalStartAt && user.formalEndAt) {
      const start = dayjs(user.formalStartAt);
      const end = dayjs(user.formalEndAt);

      if (now.isAfter(end)) return 100;
      if (now.isBefore(start)) return 0;

      const total = end.diff(start);
      const used = now.diff(start);
      return Math.min(100, Math.round((used / total) * 100));
    }

    return 0;
  }
}
