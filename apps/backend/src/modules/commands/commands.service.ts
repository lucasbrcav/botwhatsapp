import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCommandDto, UpdateCommandDto } from './dto/command.dto';

@Injectable()
export class CommandsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.command.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async create(dto: CreateCommandDto) {
    // Sanitize trigger: allow only word characters and hyphens
    const safeTrigger = dto.trigger.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!safeTrigger) {
      throw new BadRequestException('Trigger inválido');
    }
    return this.prisma.command.create({
      data: {
        trigger: safeTrigger,
        payload: dto.payload,
        enabled: dto.enabled ?? true,
        allowedScopes: dto.allowedScopes ?? '{"dms":true,"groups":true,"groupIds":[]}',
      },
    });
  }

  update(id: number, dto: UpdateCommandDto) {
    return this.prisma.command.update({
      where: { id },
      data: dto,
    });
  }

  remove(id: number) {
    return this.prisma.command.delete({ where: { id } });
  }
}
