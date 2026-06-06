import { Module } from '@nestjs/common';
import { OrderCronjobService } from './order-cronjob.service';
import { ScheduleModule } from '@nestjs/schedule';
import { DrizzleModule } from 'src/database/drizzle.module';
@Module({
    imports:[ScheduleModule.forRoot(), DrizzleModule],
    providers: [OrderCronjobService],
})
export class OrderCronjobModule {}
