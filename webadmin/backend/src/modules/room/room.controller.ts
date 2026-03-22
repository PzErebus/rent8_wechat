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
import { RoomService } from './room.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { RoomQueryDto } from './dto/room-query.dto';
import { LandlordAuthGuard } from '../landlord/guards/landlord-auth.guard';

@ApiTags('房间管理')
@Controller('room')
export class RoomController {
  constructor(private roomService: RoomService) {}

  @Post()
  @UseGuards(LandlordAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建房间' })
  async create(@Request() req, @Body() dto: CreateRoomDto) {
    const result = await this.roomService.create(req.user.userId, dto);
    return {
      code: 1,
      data: result,
      msg: '创建成功',
    };
  }

  @Get()
  @UseGuards(LandlordAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取房间列表' })
  async findAll(@Request() req, @Query() query: RoomQueryDto) {
    const result = await this.roomService.findAll(req.user.userId, query);
    return {
      code: 1,
      data: result,
      msg: 'success',
    };
  }

  @Get('stats')
  @UseGuards(LandlordAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取房间统计' })
  async getStats(@Request() req) {
    const result = await this.roomService.getStats(req.user.userId);
    return {
      code: 1,
      data: result,
      msg: 'success',
    };
  }

  @Get(':id')
  @UseGuards(LandlordAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取房间详情' })
  async findOne(@Request() req, @Param('id') id: number) {
    const result = await this.roomService.findOne(req.user.userId, Number(id));
    return {
      code: 1,
      data: result,
      msg: 'success',
    };
  }

  @Put(':id')
  @UseGuards(LandlordAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新房间' })
  async update(
    @Request() req,
    @Param('id') id: number,
    @Body() dto: UpdateRoomDto,
  ) {
    const result = await this.roomService.update(
      req.user.userId,
      Number(id),
      dto,
    );
    return {
      code: 1,
      data: result,
      msg: '更新成功',
    };
  }

  @Delete(':id')
  @UseGuards(LandlordAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除房间' })
  async remove(@Request() req, @Param('id') id: number) {
    await this.roomService.remove(req.user.userId, Number(id));
    return {
      code: 1,
      msg: '删除成功',
    };
  }
}
