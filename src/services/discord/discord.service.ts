import { Injectable, OnModuleInit } from '@nestjs/common';
import { Client, GatewayIntentBits, TextChannel } from 'discord.js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DiscordService implements OnModuleInit{

    private client: Client;
    private channelId: string;
    
    constructor(
        private readonly configService: ConfigService
    ){
        this.client = new Client({
            intents:[
                GatewayIntentBits.DirectMessages,
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent
            ]
        })

        this.channelId = this.configService.get<string>('CHANNELID_DISCORD')!;
    }

    onModuleInit() {
        this.client.login(this.configService.get<string>('TOKEN_DISCORD'));
        this.client.once('ready', () => {
            console.log(`Logged in as ${this.client.user?.tag}`);
        });
    }

    sendToFormatCode(logData: {
        code : string,
        message: string,
        title: string
    }){
        console.log("📢 Sending log to Discord...", logData);
        const { code, message = 'This is some additional information about the code.', title = 'Code Example'} = logData
        if( 1 === 1) {
            //product and dev
        }
        const codeMessage = {
            content:message,
            embeds:[
                {
                    color:parseInt('00ff00',16),
                    title,
                    description:'```json\n' + JSON.stringify(code, null, 2) + '\n```',
                },
            ],
        }
        this.sendToMessage( codeMessage )
    }

    sendToMessage(message: { 
        content: string,
        embeds: Array<object>
    }){//type casting
        const channel  = this.client.channels.cache.get(this.channelId as string) as TextChannel
        if(!channel){
            console.error(`Couldn't find the channel ...`,this.channelId)
            return
        }
        //message use chat gpt api call to level up
        
        channel.send(message).catch(e => console.error(e))
    }
}
