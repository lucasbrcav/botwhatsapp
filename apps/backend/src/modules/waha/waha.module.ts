import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { WahaService } from './waha.service';
import { WahaController } from './waha.controller';

@Module({
  imports: [HttpModule],
  providers: [WahaService],
  controllers: [WahaController],
  exports: [WahaService],
})
export class WahaModule {}
