    import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
    import { PrismaClient } from '@prisma/client';
    import { PRE_FILTER_OPERATIONS } from 'src/shared/constants/prisma.constant';
    import { addCreationTimestamps, addUpdationTimestamps } from 'src/shared/helpers/add-timestamp.helper';

    //onmoduleinit means we call this once 
    @Injectable()
    export class PrismaService extends PrismaClient implements OnModuleInit {

        //automatically connect to database once nestjs start
        async onModuleInit() {
            await this.$connect();

            //copy and override all property from PrismaService$extends to PrismaService
            Object.assign(
                this,
                this.$extends({
                    query: {
                        $allModels: {
                            async $allOperations({ operation, args, query, model }) {
                            const prisma = new PrismaClient();
                            // filter the active records
                            const filteredWhereConditions = {
                                ...(args as any).where,
                                isActive: true,
                            };

                            // change the operation from delete action to update action
                            switch (operation) {
                                //instead of delete, we update isActive to false
                                case 'delete':
                                return await prisma[model].update({
                                    ...args,
                                    where: filteredWhereConditions,
                                    data: addUpdationTimestamps({ isActive: false }),
                                });
                                case 'deleteMany':
                                return await prisma[model].updateMany({
                                    ...args,
                                    where: filteredWhereConditions,
                                    data: addUpdationTimestamps({ isActive: false }),
                                });

                                //automatically add timestamps before store to db
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

                                /**
                                 * automatically add timestamp when updating
                                 * 
                                */
                                case 'update':
                                case 'updateMany':
                                return query({
                                    ...args,
                                    where: filteredWhereConditions,
                                    data: addUpdationTimestamps(args.data),
                                });


                                default:
                                if (PRE_FILTER_OPERATIONS.includes(operation)) {
                                    const filterdArgs = {
                                        ...args,
                                        where: filteredWhereConditions,
                                    } as typeof args;
                                    return query(filterdArgs);
                                }
                                return query(args);
                            }
                            },
                        },
                    },
                }),
            );
        }

        async gracefulShutdown(application: INestApplication) {
            this.$on('beforeExit' as never, async () => {
            await application.close();
            });
        } 
    }
