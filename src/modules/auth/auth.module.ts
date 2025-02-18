import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/services/prisma/prisma.module';
import { KeyTokenModule } from '../keytoken/keytoken.module';
import { JwtService } from './jwt.service';
@Module({
    imports:[PrismaModule, KeyTokenModule],
    providers:[JwtService],
    exports:[JwtService]
})
export class AuthModule {}
