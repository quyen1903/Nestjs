import { ConfigService } from '@nestjs/config';
import { Client } from 'discord.js';
import { DiscordService } from './discord.service';

jest.mock('discord.js', () => ({
  Client: jest.fn(),
  GatewayIntentBits: {
    DirectMessages: 1,
    Guilds: 2,
    GuildMessages: 3,
    MessageContent: 4,
  },
}));

describe('DiscordService', () => {
  it('does not create or connect a client unless explicitly enabled', async () => {
    const configService = {
      get: jest.fn().mockReturnValue(undefined),
    };

    const service = new DiscordService(configService as unknown as ConfigService);

    await service.onModuleInit();
    service.sendToFormatCode({
      code: '{"method":"GET"}',
      message: '/health',
      title: 'Method: GET',
    });

    expect(Client).not.toHaveBeenCalled();
  });
});
