import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BillService } from './bill.service';
import { CreateBillDto } from './dto/create-bill.dto';
import { LandlordAuthGuard } from '../landlord/guards/landlord-auth.guard';

@ApiTags('账单管理')
@Controller('bill')
export class BillController {
  constructor(private billService: BillService) {}

  @Post()
  @UseGuards(LandlordAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建账单' })
  async create(@Request() req, @Body() dto: CreateBillDto) {
    const result = await this.billService.create(req.user.userId, dto);
    return { code: 1, data: result, msg: '创建成功' };
  }

  @Get()
  @UseGuards(LandlordAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取账单列表' })
  async findAll(
    @Request() req,
    @Query() query: { page?: number; pageSize?: number; status?: string; roomId?: number; month?: string },
  ) {
    const result = await this.billService.findAll(req.user.userId, query);
    return { code: 1, data: result, msg: 'success' };
  }

  @Get('stats')
  @UseGuards(LandlordAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取账单统计' })
  async getStats(@Request() req, @Query('month') month?: string) {
    const result = await this.billService.getStats(req.user.userId, month);
    return { code: 1, data: result, msg: 'success' };
  }

  @Get(':id')
  @UseGuards(LandlordAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取账单详情' })
  async findOne(@Request() req, @Param('id') id: number) {
    const result = await this.billService.findOne(req.user.userId, Number(id));
    return { code: 1, data: result, msg: 'success' };
  }

  @Put(':id')
  @UseGuards(LandlordAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新账单' })
  async update(@Request() req, @Param('id') id: number, @Body() dto: { amount?: number; remark?: string }) {
    const result = await this.billService.update(req.user.userId, Number(id), dto);
    return { code: 1, data: result, msg: '更新成功' };
  }

  @Delete(':id')
  @UseGuards(LandlordAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除账单' })
  async remove(@Request() req, @Param('id') id: number) {
    await this.billService.remove(req.user.userId, Number(id));
    return { code: 1, msg: '删除成功' };
  }

  @Post(':id/pay')
  @UseGuards(LandlordAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '标记账单已支付' })
  async pay(@Request() req, @Param('id') id: number) {
    const result = await this.billService.pay(req.user.userId, Number(id));
    return { code: 1, data: result, msg: '操作成功' };
  }
}
