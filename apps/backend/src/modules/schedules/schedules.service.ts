import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { getDay, getHours, getMinutes } from 'date-fns';

interface TimeRange {
  dow: number;       // 0=Sunday … 6=Saturday
  startHHmm: string; // "22:00"
  endHHmm: string;   // "07:00"
}

interface AutoReplyContext {
  chatId: string;
  isGroup: boolean;
  session: string;
}

@Injectable()
export class SchedulesService {
  private readonly logger = new Logger(SchedulesService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('outgoing-messages') private readonly outgoingQueue: Queue,
  ) {}

  findAll() {
    return this.prisma.scheduleProfile.findMany({ orderBy: { createdAt: 'desc' } });
  }

  create(data: any) {
    return this.prisma.scheduleProfile.create({ data });
  }

  update(id: number, data: any) {
    return this.prisma.scheduleProfile.update({ where: { id }, data });
  }

  remove(id: number) {
    return this.prisma.scheduleProfile.delete({ where: { id } });
  }

  async tryAutoReply(ctx: AutoReplyContext): Promise<boolean> {
    const profiles = await this.prisma.scheduleProfile.findMany({
      where: { enabled: true },
    });

    for (const profile of profiles) {
      // Check scope
      const groupIds: string[] = JSON.parse(profile.allowedGroupIds || '[]');
      if (ctx.isGroup) {
        if (!groupIds.includes(ctx.chatId)) continue;
      } else {
        if (!profile.appliesToDms) continue;
      }

      // Check time window
      const inWindow = this.isInWindow(profile.ranges, profile.timezone);
      if (!inWindow) continue;

      // Check cooldown via Redis (using Bull queue's built-in dedup via job id)
      const cooldownKey = `cooldown:${ctx.chatId}:${profile.id}`;
      const existing = await this.outgoingQueue.getJob(cooldownKey);
      if (existing) {
        this.logger.debug(`Cooldown active for ${ctx.chatId} profile ${profile.id}`);
        continue;
      }

      // Enqueue with job id = cooldown key and delay = cooldown period
      await this.outgoingQueue.add(
        'send',
        { chatId: ctx.chatId, text: profile.message, session: ctx.session },
        {
          jobId: cooldownKey,
          delay: profile.cooldownSeconds * 1000,
          removeOnComplete: true,
        },
      );

      // Send immediately (the job above is just for dedup/TTL tracking)
      await this.outgoingQueue.add('send', {
        chatId: ctx.chatId,
        text: profile.message,
        session: ctx.session,
      });

      this.logger.log(`Auto-reply sent for profile "${profile.name}" to ${ctx.chatId}`);
      return true;
    }

    return false;
  }

  private isInWindow(rangesJson: string, timezone: string): boolean {
    let ranges: TimeRange[] = [];
    try {
      ranges = JSON.parse(rangesJson);
    } catch {
      return false;
    }

    const now = new Date();
    const zoned = toZonedTime(now, timezone);
    const dow = getDay(zoned);
    const h = getHours(zoned);
    const m = getMinutes(zoned);
    const currentMinutes = h * 60 + m;

    for (const range of ranges) {
      if (range.dow !== dow) continue;
      const [sh, sm] = range.startHHmm.split(':').map(Number);
      const [eh, em] = range.endHHmm.split(':').map(Number);
      const start = sh * 60 + sm;
      const end = eh * 60 + em;

      // Support overnight ranges (e.g. 22:00 - 07:00)
      if (start <= end) {
        if (currentMinutes >= start && currentMinutes < end) return true;
      } else {
        if (currentMinutes >= start || currentMinutes < end) return true;
      }
    }

    return false;
  }
}
