import { Controller } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { DiscordService } from './discord.service';

@Controller('discord')
@ApiExcludeController()
export class DiscordController {
  constructor(private readonly discordService: DiscordService) {}
}
