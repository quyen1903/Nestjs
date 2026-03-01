import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from 'prisma/generated/prisma';
import { PRE_FILTER_OPERATIONS } from '../../shared/constants/prisma.constant';
import { addCreationTimestamps, addUpdationTimestamps } from '../../shared/helpers/add-timestamp.helper';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
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
            adapter,
            log: ['query', 'info', 'warn', 'error'],
        });
    }

    async onModuleInit() {
        await this.$connect();

        Object.assign(
            this,
            this.$extends({
                query: {
                    $allModels: {
                        async $allOperations({ operation, args, query, model }) {
                            const filteredWhereConditions = {
                                ...(args as any).where,
                                isActive: true,
                            };

                            switch (operation) {
                                case 'delete':
                                    return await (this[model as any] as any).update({
                                        ...args,
                                        where: filteredWhereConditions,
                                        data: addUpdationTimestamps({ isActive: false }),
                                    });
                                case 'deleteMany':
                                    return await (this[model as any] as any).updateMany({
                                        ...args,
                                        where: filteredWhereConditions,
                                        data: addUpdationTimestamps({ isActive: false }),
                                    });
                                case 'create':
                                    return query({
                                        ...args,
                                        data: addCreationTimestamps(args.data),
                                    });
                                case 'createMany':
                                    return query({
                                        ...args,
                                        data: (args.data as unknown[]).map((item: unknown) => addCreationTimestamps(item)),
                                    });
                                case 'update':
                                case 'updateMany':
                                    return query({
                                        ...args,
                                        where: filteredWhereConditions,
                                        data: addUpdationTimestamps(args.data),
                                    });
                                default:
                                    if (PRE_FILTER_OPERATIONS.includes(operation)) {
                                        const filteredArgs = {
                                            ...args,
                                            where: filteredWhereConditions,
                                        } as typeof args;
                                        return query(filteredArgs);
                                    }
                                    return query(args);
                            }
                        },
                    },
                },
            }),
        );
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }

    async gracefulShutdown(application: INestApplication) {
        this.$on('beforeExit' as never, async () => {
            await application.close();
        });
    }
}
