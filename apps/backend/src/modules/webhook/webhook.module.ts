import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { CommandsModule } from '../commands/commands.module';
import { SchedulesModule } from '../schedules/schedules.module';
import { MessagesModule } from '../messages/messages.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [CommandsModule, SchedulesModule, MessagesModule, SettingsModule],
  controllers: [WebhookController],
})
export class WebhookModule {}
