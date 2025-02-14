import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { AccessModule } from './modules/access/access.module';

@Module({
  imports: [AuthModule, AccessModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
