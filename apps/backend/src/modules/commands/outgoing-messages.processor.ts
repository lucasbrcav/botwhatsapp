import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { WahaService } from '../waha/waha.service';

@Processor('outgoing-messages')
export class OutgoingMessagesProcessor {
  private readonly logger = new Logger(OutgoingMessagesProcessor.name);

  constructor(private readonly wahaService: WahaService) {}

  @Process('send')
  async handleSend(job: Job<{ chatId: string; text: string; session: string }>) {
    const { chatId, text, session } = job.data;
    try {
      await this.wahaService.sendText(chatId, text, session);
      this.logger.log(`Message sent to ${chatId}`);
    } catch (err) {
      this.logger.error(`Failed to send message to ${chatId}: ${err.message}`);
      throw err;
    }
  }
}
