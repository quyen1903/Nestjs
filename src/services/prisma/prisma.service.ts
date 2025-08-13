import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PRE_FILTER_OPERATIONS } from 'src/shared/constants/prisma.constant';
import { addCreationTimestamps, addUpdationTimestamps } from 'src/shared/helpers/add-timestamp.helper';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private softDeleteModels: Set<string> = new Set();

  constructor() {
    super({ log: ['query', 'info', 'warn', 'error'] });

    const models = (this as any)._dmmf.modelMap;
    for (const modelName in models) {
      if (models[modelName].fields.some((f: any) => f.name === 'isActive')) {
        this.softDeleteModels.add(modelName);
      }
    }
  }

  async onModuleInit() {
    await this.$connect();

    const softDeleteModels = this.softDeleteModels; // capture variable 

    Object.assign(
      this,
      this.$extends({
        query: {
          $allModels: {
            async $allOperations({ operation, args, query, model }) {
              const prisma = new PrismaClient();
              const isSoftDeleteModel = softDeleteModels.has(model);

              const filteredWhere = isSoftDeleteModel
                ? { ...(args as any).where, isActive: true }
                : { ...(args as any).where };

              switch (operation) {
                case 'delete':
                  if (isSoftDeleteModel) {
                    return await prisma[model].update({
                      ...args,
                      where: filteredWhere,
                      data: addUpdationTimestamps({ isActive: false }),
                    });
                  }
                  return query(args); // hard delete

                case 'deleteMany':
                  if (isSoftDeleteModel) {
                    return await prisma[model].updateMany({
                      ...args,
                      where: filteredWhere,
                      data: addUpdationTimestamps({ isActive: false }),
                    });
                  }
                  return query(args); // hard delete

                case 'create':
                  return query({ ...args, data: addCreationTimestamps(args.data) });

                case 'createMany':
                  return query({
                    ...args,
                    data: (args.data as unknown[]).map((item: unknown) =>
                      addCreationTimestamps(item)
                    ),
                  });

                case 'update':
                case 'updateMany':
                  return query({
                    ...args,
                    where: filteredWhere,
                    data: addUpdationTimestamps(args.data),
                  });

                default:
                  if (isSoftDeleteModel && PRE_FILTER_OPERATIONS.includes(operation)) {
                    return query({ ...args, where: filteredWhere });
                  }
                  return query(args);
              }
            },
          },
        },
      })
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
