import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface LogInboundDto {
  chatId: string;
  isGroup: boolean;
  from: string;
  body: string;
}

interface LogOutboundDto extends LogInboundDto {
  commandId?: number;
}

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  async logInbound(dto: LogInboundDto) {
    return this.prisma.messageLog.create({
      data: {
        direction: 'inbound',
        ...dto,
      },
    });
  }

  async logOutbound(dto: LogOutboundDto) {
    return this.prisma.messageLog.create({
      data: {
        direction: 'outbound',
        chatId: dto.chatId,
        isGroup: dto.isGroup,
        from: dto.from,
        body: dto.body,
        matchedCommandId: dto.commandId,
      },
    });
  }

  findByChatId(chatId: string, limit = 50) {
    return this.prisma.messageLog.findMany({
      where: { chatId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { command: { select: { trigger: true } } },
    });
  }

  findAll(limit = 100) {
    return this.prisma.messageLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { command: { select: { trigger: true } } },
    });
  }
}
