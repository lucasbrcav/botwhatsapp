import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { CommandsDispatcher } from './commands.dispatcher';
import { CommandsController } from './commands.controller';
import { CommandsService } from './commands.service';
import { OutgoingMessagesProcessor } from './outgoing-messages.processor';
import { WahaModule } from '../waha/waha.module';
import { MessagesModule } from '../messages/messages.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'outgoing-messages',
      defaultJobOptions: {
        removeOnComplete: true,
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        delay: 1100, // throttle ~1s between sends
      },
    }),
    WahaModule,
    MessagesModule,
    SettingsModule,
  ],
  providers: [CommandsDispatcher, CommandsService, OutgoingMessagesProcessor],
  controllers: [CommandsController],
  exports: [CommandsDispatcher],
})
export class CommandsModule {}
