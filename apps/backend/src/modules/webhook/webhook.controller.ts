import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Logger,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { CommandsDispatcher } from '../commands/commands.dispatcher';
import { SchedulesService } from '../schedules/schedules.service';
import { MessagesService } from '../messages/messages.service';
import { SettingsService } from '../settings/settings.service';
import { WahaMessageEvent } from './interfaces/waha-event.interface';

@Controller('webhooks')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private readonly dispatcher: CommandsDispatcher,
    private readonly schedulesService: SchedulesService,
    private readonly messagesService: MessagesService,
    private readonly settingsService: SettingsService,
  ) {}

  @Post('waha')
  @HttpCode(200)
  async handleWahaEvent(
    @Headers('x-webhook-secret') secret: string,
    @Body() body: WahaMessageEvent,
  ) {
    const expectedSecret = process.env.WEBHOOK_SECRET;
    if (!expectedSecret || secret !== expectedSecret) {
      throw new UnauthorizedException('Invalid webhook secret');
    }

    if (body.event !== 'message') {
      return { ok: true };
    }

    const settings = await this.settingsService.get();
    if (!settings.botEnabled) {
      return { ok: true };
    }

    const { payload } = body;
    const chatId: string = payload.from;
    const isGroup = chatId.includes('@g.us');
    const from: string = payload._data?.author || payload.from;
    const text: string = payload.body || '';

    // Log inbound message
    await this.messagesService.logInbound({
      chatId,
      isGroup,
      from,
      body: text,
    });

    // Try to dispatch as a command
    const handled = await this.dispatcher.dispatch({
      chatId,
      isGroup,
      from,
      text,
      session: body.session,
    });

    if (!handled) {
      // Try auto-reply schedule if no command matched
      await this.schedulesService.tryAutoReply({
        chatId,
        isGroup,
        session: body.session,
      });
    }

    return { ok: true };
  }
}
