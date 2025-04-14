import { Module } from '@nestjs/common';
import { MurlockService } from './murlock.service';
import { MurlockController } from './murlock.controller';
import { MurLockModule } from 'murlock';


@Module({
  imports:[
    MurLockModule.forRoot({
      redisOptions:{url: "redis://localhost:6379"},
      wait: 1000,
      maxAttempts: 4,
      logLevel: 'log'
    })
  ],
  controllers: [MurlockController],
  providers: [MurlockService],
})
export class MurlockModule {}
