import { Module } from '@nestjs/common';
import { ApiService } from './api.service';
import { ApiController } from './api.controller';
import { PrismaModule } from 'src/services/prisma/prisma.module';

@Module({
  imports:[PrismaModule],
  controllers: [ApiController],
  providers: [ApiService],
  exports:[ApiService]
})
export class ApiModule {}
