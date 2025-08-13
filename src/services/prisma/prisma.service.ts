import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { getDMMF } from '@prisma/internals';
import { addCreationTimestamps, addUpdationTimestamps } from 'src/shared/helpers/add-timestamp.helper';
import { PRE_FILTER_OPERATIONS } from 'src/shared/constants/prisma.constant';
import fs from 'fs';
import path from 'path';

/**
 * if we have field isActive in prisma (also know as is_active in database SQL level)
 * we would perform soft delete
 * once table dont have isActive (is_active) perform hard delete
 * 
 * with update and create query, we add time stamp every time we perform query
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private softDeleteModels: Set<string> = new Set();

  constructor() {
    super({ log: ['query', 'info', 'warn', 'error'] });
  }

  async onModuleInit() {
    await this.$connect();

    // 1 Load schema.prisma
    const schemaPath = path.resolve(__dirname, '../../../prisma/schema.prisma'); // path adjust following project
    const datamodel = fs.readFileSync(schemaPath, 'utf-8');

    const dmmf = await getDMMF({ datamodel });

    // 2 automatically determine models have field "isActive"
    const softDeleteModels = this.softDeleteModels; // closure to use inside $allOperations
    for (const model of dmmf.datamodel.models) {
      if (model.fields.some(f => f.name === 'isActive')) {
        softDeleteModels.add(model.name);
      }
    }

    // 3 Override all operations
    Object.assign(
      this,
      this.$extends({
        query: {
          $allModels: {
            async $allOperations({ operation, args, query, model }) {
              const isSoftDeleteModel = softDeleteModels.has(model);

              // default filter for "read" operation
              const filteredWhereConditions = isSoftDeleteModel
                ? { ...(args as any).where, isActive: true }
                : { ...(args as any).where };

              switch (operation) {
                // Soft delete
                case 'delete':
                  if (isSoftDeleteModel) {
                    return await query({
                      ...args,
                      where: filteredWhereConditions,
                      data: addUpdationTimestamps({ isActive: false }),
                    });
                  }
                  return query(args); // hard delete

                case 'deleteMany':
                  if (isSoftDeleteModel) {
                    return await query({
                      ...args,
                      where: filteredWhereConditions,
                      data: addUpdationTimestamps({ isActive: false }),
                    });
                  }
                  return query(args);

                // Create
                case 'create':
                  return query({ ...args, data: addCreationTimestamps(args.data) });

                case 'createMany':
                  return query({
                    ...args,
                    data: (args.data as unknown[]).map((item) => addCreationTimestamps(item)),
                  });

                // Update
                case 'update':
                case 'updateMany':
                  return query({
                    ...args,
                    where: filteredWhereConditions,
                    data: addUpdationTimestamps(args.data),
                  });

                // Pre-filter for find operations
                default:
                  if (isSoftDeleteModel && PRE_FILTER_OPERATIONS.includes(operation)) {
                    const filteredArgs = { ...args, where: filteredWhereConditions } as typeof args;
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
