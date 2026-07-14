import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, GatewayIntentBits, TextChannel } from 'discord.js';

@Injectable()
export class DiscordService implements OnModuleInit {
    private readonly logger = new Logger(DiscordService.name);
    private readonly client: Client | null;
    private readonly channelId: string | undefined;
    private readonly enabled: boolean;

    constructor(private readonly configService: ConfigService) {
        this.enabled = this.configService.get<string>('DISCORD_ENABLED') === 'true';
        this.client = this.enabled
            ? new Client({
                intents: [
                    GatewayIntentBits.DirectMessages,
                    GatewayIntentBits.Guilds,
                    GatewayIntentBits.GuildMessages,
                    GatewayIntentBits.MessageContent,
                ],
            })
            : null;
        this.channelId = this.configService.get<string>('CHANNELID_DISCORD');
    }

    async onModuleInit() {
        if (!this.enabled || !this.client) {
            return;
        }

        const token = this.configService.get<string>('TOKEN_DISCORD');
        if (!token || !this.channelId) {
            this.logger.warn('Discord integration is enabled but not configured');
            return;
        }

        this.client.once('ready', () => {
            this.logger.log('Discord integration connected');
        });

        try {
            await this.client.login(token);
        } catch {
            this.logger.error('Discord integration failed to connect');
        }
    }

    sendToFormatCode(logData: {
        code: string;
        message: string;
        title: string;
    }) {
        if (!this.enabled) {
            return;
        }

        const {
            code,
            message = 'This is some additional information about the code.',
            title = 'Code Example',
        } = logData;
        const codeMessage = {
            content: message,
            embeds: [
                {
                    color: parseInt('00ff00', 16),
                    title,
                    description: '```json\n' + JSON.stringify(code, null, 2) + '\n```',
                },
            ],
        };
        this.sendToMessage(codeMessage);
    }

    sendToMessage(message: {
        content: string;
        embeds: Array<object>;
    }) {
        if (!this.enabled || !this.client || !this.channelId) {
            return;
        }

        const channel = this.client.channels.cache.get(this.channelId) as TextChannel;
        if (!channel) {
            this.logger.warn('Discord channel is unavailable');
            return;
        }

        channel.send(message).catch(() => {
            this.logger.error('Discord message delivery failed');
        });
    }
}
