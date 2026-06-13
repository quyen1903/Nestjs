import { Module } from '@nestjs/common';
import { ShopAuthService } from './shop-auth.service';
import { ShopAuthController } from './shop-auth.controller';
import { PrismaModule } from 'src/services/prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { KafkaModule } from 'src/services/kafka/kafka.module';
import { KeyTokenModule } from 'src/modules/keytoken/keytoken.module';

@Module({
  imports: [PrismaModule, JwtModule.register({}), KafkaModule, KeyTokenModule],
  controllers: [ShopAuthController],
  providers: [ShopAuthService, ],
  exports: [ShopAuthService, ]
})
export class ShopAuthModule {}
