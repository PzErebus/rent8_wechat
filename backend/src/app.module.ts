import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { OrdersModule } from './modules/orders/orders.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { SettingsModule } from './modules/settings/settings.module';
import { LogsModule } from './modules/logs/logs.module';
import { LandlordModule } from './modules/landlord/landlord.module';
import { RoomsModule } from './modules/room/room.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { BillsModule } from './modules/bills/bills.module';

@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),

    // 限流模块
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1分钟
        limit: 100, // 100次请求
      },
    ]),

    // 缓存模块 (Redis)
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => ({
        store: redisStore as any,
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        ttl: 3600, // 默认缓存1小时
      }),
    }),

    // Prisma ORM
    PrismaModule,

    // 业务模块
    AuthModule,
    UsersModule,
    OrdersModule,
    DashboardModule,
    SettingsModule,
    LogsModule,
    LandlordModule,
    RoomsModule,
    TenantsModule,
    BillsModule,
  ],
})
export class AppModule {}
