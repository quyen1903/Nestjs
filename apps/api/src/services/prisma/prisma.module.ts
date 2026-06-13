import { Module } from '@nestjs/common';
import { PrismaRawService } from './prisma-raw.service';
import { PrismaService } from './prisma.service';

@Module({
  providers: [PrismaService, PrismaRawService],
  exports: [PrismaService, PrismaRawService],
})
export class PrismaModule {}
