import { Module } from '@nestjs/common';
import { SendController } from './send.controller';
import { WahaModule } from '../waha/waha.module';
import { MessagesModule } from '../messages/messages.module';

@Module({
  imports: [WahaModule, MessagesModule],
  controllers: [SendController],
})
export class SendModule {}
