import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CommandsService } from './commands.service';
import { CreateCommandDto, UpdateCommandDto } from './dto/command.dto';

@UseGuards(JwtAuthGuard)
@Controller('commands')
export class CommandsController {
  constructor(private readonly commandsService: CommandsService) {}

  @Get()
  findAll() {
    return this.commandsService.findAll();
  }

  @Post()
  create(@Body() dto: CreateCommandDto) {
    return this.commandsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCommandDto) {
    return this.commandsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.commandsService.remove(id);
  }
}
