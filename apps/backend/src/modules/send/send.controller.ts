import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WahaService } from '../waha/waha.service';
import { MessagesService } from '../messages/messages.service';
import { IsString } from 'class-validator';

class SendMessageDto {
  @IsString()
  chatId: string;

  @IsString()
  text: string;
}

@UseGuards(JwtAuthGuard)
@Controller('send')
export class SendController {
  constructor(
    private readonly wahaService: WahaService,
    private readonly messagesService: MessagesService,
  ) {}

  @Post()
  @HttpCode(200)
  async send(@Body() dto: SendMessageDto) {
    await this.wahaService.sendText(dto.chatId, dto.text);
    await this.messagesService.logOutbound({
      chatId: dto.chatId,
      isGroup: dto.chatId.includes('@g.us'),
      from: 'admin',
      body: dto.text,
    });
    return { ok: true };
  }
}
