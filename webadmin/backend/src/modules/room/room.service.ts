import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { RoomQueryDto } from './dto/room-query.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class RoomService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, dto: CreateRoomDto) {
    return this.prisma.room.create({
      data: {
        userId,
        roomNo: dto.roomNumber,
        address: '', // 可以后续完善
        rent: dto.rent,
        deposit: 0,
        area: dto.area,
        status: 'VACANT',
      },
    });
  }

  async findAll(userId: number, query: RoomQueryDto) {
    const { page = 1, pageSize = 10, status, floor, keyword } = query;

    const where: Prisma.RoomWhereInput = {
      userId,
    };

    // 状态筛选
    if (status) {
      where.status = status === 'available' ? 'VACANT' : 'OCCUPIED';
    }

    // 楼层筛选
    if (floor) {
      // 楼层字段需要根据实际需求添加
    }

    // 关键词搜索
    if (keyword) {
      where.OR = [
        { roomNo: { contains: keyword } },
        { address: { contains: keyword } },
      ];
    }

    const [list, total] = await Promise.all([
      this.prisma.room.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { tenants: true, bills: true },
          },
        },
      }),
      this.prisma.room.count({ where }),
    ]);

    // 统计信息
    const stats = await this.getStats(userId);

    return {
      list: list.map((room) => ({
        id: room.id,
        roomNumber: room.roomNo,
        floor: 0, // 暂无楼层字段
        area: room.area,
        rent: Number(room.rent),
        status: room.status === 'VACANT' ? 'available' : 'rented',
        tenantCount: room._count.tenants,
        billCount: room._count.bills,
        createdAt: room.createdAt,
      })),
      total,
      page,
      pageSize,
      stats,
    };
  }

  async findOne(userId: number, id: number) {
    const room = await this.prisma.room.findFirst({
      where: { id, userId },
      include: {
        tenants: {
          where: { status: 'ACTIVE' },
        },
        bills: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!room) {
      throw new NotFoundException('房间不存在');
    }

    return {
      id: room.id,
      roomNumber: room.roomNo,
      address: room.address,
      area: room.area,
      rent: Number(room.rent),
      deposit: Number(room.deposit),
      status: room.status === 'VACANT' ? 'available' : 'rented',
      description: room.description,
      currentTenant: room.tenants[0] || null,
      recentBills: room.bills.map((bill) => ({
        id: bill.id,
        type: bill.billType.toLowerCase(),
        amount: Number(bill.amount),
        status: bill.status.toLowerCase(),
        periodStart: bill.periodStart,
        periodEnd: bill.periodEnd,
      })),
    };
  }

  async update(userId: number, id: number, dto: UpdateRoomDto) {
    // 检查房间是否存在
    const existRoom = await this.prisma.room.findFirst({
      where: { id, userId },
    });

    if (!existRoom) {
      throw new NotFoundException('房间不存在');
    }

    const updateData: Prisma.RoomUpdateInput = {};

    if (dto.roomNumber !== undefined) {
      updateData.roomNo = dto.roomNumber;
    }
    if (dto.area !== undefined) {
      updateData.area = dto.area;
    }
    if (dto.rent !== undefined) {
      updateData.rent = dto.rent;
    }
    if (dto.status !== undefined) {
      updateData.status = dto.status === 'available' ? 'VACANT' : 'OCCUPIED';
    }
    if (dto.description !== undefined) {
      updateData.description = dto.description;
    }

    return this.prisma.room.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(userId: number, id: number) {
    const existRoom = await this.prisma.room.findFirst({
      where: { id, userId },
    });

    if (!existRoom) {
      throw new NotFoundException('房间不存在');
    }

    // 软删除 - 改为维护状态
    return this.prisma.room.update({
      where: { id },
      data: { status: 'MAINTENANCE' },
    });
  }

  async getStats(userId: number) {
    const [total, vacant, occupied] = await Promise.all([
      this.prisma.room.count({ where: { userId } }),
      this.prisma.room.count({ where: { userId, status: 'VACANT' } }),
      this.prisma.room.count({ where: { userId, status: 'OCCUPIED' } }),
    ]);

    // 本月收入
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const monthBills = await this.prisma.bill.aggregate({
      where: {
        userId,
        status: 'PAID',
        paidAt: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      _sum: {
        paidAmount: true,
      },
    });

    return {
      total,
      vacant,
      occupied,
      monthIncome: Number(monthBills._sum.paidAmount || 0),
    };
  }
}
