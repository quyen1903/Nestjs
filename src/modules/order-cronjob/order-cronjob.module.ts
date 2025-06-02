import { Module } from '@nestjs/common';
import { OrderCronjobService } from './order-cronjob.service';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from 'src/services/prisma/prisma.module';
@Module({
    imports:[ScheduleModule.forRoot(), PrismaModule],
    providers: [OrderCronjobService],
})
export class OrderCronjobModule {}
