import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { WahaModule } from './modules/waha/waha.module';
import { WebhookModule } from './modules/webhook/webhook.module';
import { CommandsModule } from './modules/commands/commands.module';
import { SchedulesModule } from './modules/schedules/schedules.module';
import { MessagesModule } from './modules/messages/messages.module';
import { SettingsModule } from './modules/settings/settings.module';
import { HealthModule } from './modules/health/health.module';
import { SendModule } from './modules/send/send.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 30 }]),
    BullModule.forRoot({
      redis: process.env.REDIS_URL || 'redis://localhost:6379',
    }),
    PrismaModule,
    AuthModule,
    WahaModule,
    WebhookModule,
    CommandsModule,
    SchedulesModule,
    MessagesModule,
    SettingsModule,
    HealthModule,
    SendModule,
  ],
})
export class AppModule {}
