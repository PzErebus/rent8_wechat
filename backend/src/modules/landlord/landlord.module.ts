import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { LandlordService } from './landlord.service';
import { LandlordController } from './landlord.controller';

@Module({
  imports: [HttpModule],
  controllers: [LandlordController],
  providers: [LandlordService],
  exports: [LandlordService],
})
export class LandlordModule {}
