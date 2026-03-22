import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBillDto } from './dto/create-bill.dto';
import { Prisma, BillType, BillStatus } from '@prisma/client';

@Injectable()
export class BillService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, dto: CreateBillDto) {
    const [year, month] = dto.month.split('-').map(Number);
    
    // 计算账单周期
    const periodStart = new Date(year, month - 1, 1);
    const periodEnd = new Date(year, month, 0);
    
    // 截止日期 = 周期结束日期
    const dueDate = new Date(periodEnd);

    return this.prisma.bill.create({
      data: {
        userId,
        roomId: dto.roomId,
        billType: dto.type.toUpperCase() as BillType,
        amount: dto.amount,
        paidAmount: 0,
        periodStart,
        periodEnd,
        dueDate,
        status: 'UNPAID' as BillStatus,
        remark: dto.remark || '',
      },
    });
  }

  async findAll(userId: number, query: { page?: number; pageSize?: number; status?: string; roomId?: number; month?: string }) {
    const { page = 1, pageSize = 10, status, roomId, month } = query;

    const where: Prisma.BillWhereInput = { userId };

    if (status && status !== 'all') {
      where.status = status.toUpperCase() as BillStatus;
    }

    if (roomId) {
      where.roomId = roomId;
    }

    if (month) {
      const [year, m] = month.split('-').map(Number);
      const start = new Date(year, m - 1, 1);
      const end = new Date(year, m, 0);
      where.periodStart = { gte: start };
      where.periodEnd = { lte: end };
    }

    const [list, total] = await Promise.all([
      this.prisma.bill.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          room: { select: { roomNo: true } },
        },
      }),
      this.prisma.bill.count({ where }),
    ]);

    // 统计数据
    const stats = await this.getStats(userId, month);

    return {
      list: list.map((bill) => ({
        id: bill.id,
        roomNumber: bill.room?.roomNo || '',
        type: bill.billType.toLowerCase(),
        amount: Number(bill.amount),
        paidAmount: Number(bill.paidAmount),
        month: bill.periodStart.toISOString().slice(0, 7),
        status: bill.status.toLowerCase(),
        remark: bill.remark,
        dueDate: bill.dueDate,
        paidAt: bill.paidAt,
      })),
      total,
      page,
      pageSize,
      stats,
    };
  }

  async findOne(userId: number, id: number) {
    const bill = await this.prisma.bill.findFirst({
      where: { id, userId },
      include: {
        room: true,
        tenant: true,
      },
    });

    if (!bill) {
      throw new NotFoundException('账单不存在');
    }

    return {
      id: bill.id,
      roomId: bill.roomId,
      roomNumber: bill.room?.roomNo || '',
      type: bill.billType.toLowerCase(),
      amount: Number(bill.amount),
      paidAmount: Number(bill.paidAmount),
      month: bill.periodStart.toISOString().slice(0, 7),
      status: bill.status.toLowerCase(),
      remark: bill.remark,
      dueDate: bill.dueDate,
      paidAt: bill.paidAt,
      createdAt: bill.createdAt,
    };
  }

  async update(userId: number, id: number, dto: { amount?: number; remark?: string }) {
    const existBill = await this.prisma.bill.findFirst({ where: { id, userId } });
    if (!existBill) {
      throw new NotFoundException('账单不存在');
    }

    return this.prisma.bill.update({
      where: { id },
      data: {
        amount: dto.amount !== undefined ? dto.amount : undefined,
        remark: dto.remark,
      },
    });
  }

  async remove(userId: number, id: number) {
    const existBill = await this.prisma.bill.findFirst({ where: { id, userId } });
    if (!existBill) {
      throw new NotFoundException('账单不存在');
    }

    return this.prisma.bill.delete({ where: { id } });
  }

  async pay(userId: number, id: number) {
    const bill = await this.prisma.bill.findFirst({ where: { id, userId } });
    if (!bill) {
      throw new NotFoundException('账单不存在');
    }

    return this.prisma.bill.update({
      where: { id },
      data: {
        status: 'PAID',
        paidAmount: bill.amount,
        paidAt: new Date(),
      },
    });
  }

  async getStats(userId: number, month?: string) {
    const now = new Date();
    const targetMonth = month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const [year, m] = targetMonth.split('-').map(Number);
    const monthStart = new Date(year, m - 1, 1);
    const monthEnd = new Date(year, m, 0);

    const [unpaid, paid, total] = await Promise.all([
      this.prisma.bill.aggregate({
        where: { userId, status: 'UNPAID', periodStart: { gte: monthStart }, periodEnd: { lte: monthEnd } },
        _sum: { amount: true },
      }),
      this.prisma.bill.aggregate({
        where: { userId, status: 'PAID', periodStart: { gte: monthStart }, periodEnd: { lte: monthEnd } },
        _sum: { paidAmount: true },
      }),
      this.prisma.bill.count({
        where: { userId, periodStart: { gte: monthStart }, periodEnd: { lte: monthEnd } },
      }),
    ]);

    return {
      unpaidAmount: Number(unpaid._sum.amount || 0),
      paidAmount: Number(paid._sum.paidAmount || 0),
      totalCount: total,
    };
  }
}
