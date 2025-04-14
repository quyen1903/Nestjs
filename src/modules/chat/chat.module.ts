import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from 'src/services/prisma/prisma.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
@Module({
    imports:[
        AuthModule,
        PrismaModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get('JWT_SECRET'),
                signOptions: { expiresIn: '7d' },
            }),
        }),
    ],
    providers: [ChatService],
    exports: [ChatService],
})
export class ChatModule {}
