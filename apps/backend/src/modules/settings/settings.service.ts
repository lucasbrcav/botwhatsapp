import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async get() {
    let settings = await this.prisma.settings.findFirst({ where: { id: 1 } });
    if (!settings) {
      settings = await this.prisma.settings.create({
        data: { id: 1, commandPrefix: '!', defaultTimezone: 'America/Sao_Paulo', botEnabled: true },
      });
    }
    return settings;
  }

  async update(data: Partial<{ commandPrefix: string; defaultTimezone: string; botEnabled: boolean }>) {
    return this.prisma.settings.upsert({
      where: { id: 1 },
      create: { id: 1, commandPrefix: '!', defaultTimezone: 'America/Sao_Paulo', botEnabled: true, ...data },
      update: data,
    });
  }
}
