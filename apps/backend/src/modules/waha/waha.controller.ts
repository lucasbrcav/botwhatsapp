import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { WahaService } from './waha.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('waha')
export class WahaController {
  constructor(private readonly wahaService: WahaService) {}

  @Get('status')
  status() {
    return this.wahaService.getStatus();
  }

  @Get('qr')
  qr() {
    return this.wahaService.getQR();
  }

  @Post('restart')
  restart() {
    return this.wahaService.restartSession();
  }

  @Get('chats')
  chats() {
    return this.wahaService.getChats();
  }

  @Get('groups')
  groups() {
    return this.wahaService.getGroups();
  }
}
