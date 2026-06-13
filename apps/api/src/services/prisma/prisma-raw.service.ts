import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../../../prisma/generated/prisma';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaRawService extends PrismaClient implements OnModuleInit {
  constructor() {
    const pool = new Pool({ 
      connectionString: process.env.DATABASE_URL!,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 20000,
      acquireTimeoutMillis: 60000,
    });
    const adapter = new PrismaPg(pool);

    super({
      adapter,  // ← BẮT BUỘC
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async gracefulShutdown(application: INestApplication) {
    this.$on('beforeExit' as never, async () => {
      await application.close();
    });
  }
}
