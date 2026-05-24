import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WahaService } from '../waha/waha.service';
import { SettingsService } from '../settings/settings.service';
import { MessagesService } from '../messages/messages.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

interface DispatchContext {
  chatId: string;
  isGroup: boolean;
  from: string;
  text: string;
  session: string;
}

@Injectable()
export class CommandsDispatcher {
  private readonly logger = new Logger(CommandsDispatcher.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly wahaService: WahaService,
    private readonly settingsService: SettingsService,
    private readonly messagesService: MessagesService,
    @InjectQueue('outgoing-messages') private readonly outgoingQueue: Queue,
  ) {}

  async dispatch(ctx: DispatchContext): Promise<boolean> {
    const settings = await this.settingsService.get();
    const prefix = settings.commandPrefix;

    if (!ctx.text.startsWith(prefix)) {
      return false;
    }

    const trigger = ctx.text.slice(prefix.length).trim().split(/\s+/)[0].toLowerCase();
    if (!trigger) return false;

    const command = await this.prisma.command.findFirst({
      where: { trigger, enabled: true },
    });

    if (!command) return false;

    // Validate scope
    let scopes: { dms?: boolean; groups?: boolean; groupIds?: string[] } = {};
    try {
      scopes = JSON.parse(command.allowedScopes);
    } catch {
      scopes = { dms: true, groups: true };
    }

    if (ctx.isGroup) {
      if (!scopes.groups) return false;
      if (scopes.groupIds && scopes.groupIds.length > 0) {
        if (!scopes.groupIds.includes(ctx.chatId)) return false;
      }
    } else {
      if (!scopes.dms) return false;
    }

    // Enqueue outgoing message
    await this.outgoingQueue.add('send', {
      chatId: ctx.chatId,
      text: command.payload,
      session: ctx.session,
    });

    // Log outbound
    await this.messagesService.logOutbound({
      chatId: ctx.chatId,
      isGroup: ctx.isGroup,
      from: 'bot',
      body: command.payload,
      commandId: command.id,
    });

    this.logger.log(`Command !${trigger} dispatched to ${ctx.chatId}`);
    return true;
  }
}
