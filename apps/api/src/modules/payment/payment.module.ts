import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import configuration from './config/configuration';
import { PrismaModule } from 'src/services/prisma/prisma.module';
import { KeyTokenModule } from '../keytoken/keytoken.module';

@Module({
  imports: [
    JwtModule,
    PrismaModule,
    KeyTokenModule,
    ConfigModule.forRoot({
      load: [configuration],
    })
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
