import { PrismaService } from "src/services/prisma/prisma.service";
import { Injectable } from "@nestjs/common";
@Injectable()
export class CategoryService{
    constructor(private readonly prismaService: PrismaService){}

    /**
     * A closure table is a table that stores all the paths 
     * between all elements in a hierarchical data structure.
     * The table includes two columns for the IDs of the related 
     * elements and a third column that represents the distance between them.
     * 
     */
    async createCategory(name: string, parentId?: string){
        return await this.prismaService.$transaction(async (tx)=>{

            //1 create the new category
            const newCategory = await tx.category.create({
                data: { name },
            });
            // 2. Always insert self-reference
            await tx.categoryClosureTable.create({
                data:{
                    ancestorId: newCategory.id,
                    descendantId: newCategory.id,
                    depth: 0
                }
            })

            if(parentId){
                //3 get all ancestors of parent
                const ancestors = await tx.categoryClosureTable.findMany({
                    where:{ descendantId: parentId}
                });

                //4 insert new paths (ancestor -> newCategory)
                const newPaths = ancestors.map((accumulator)=>({
                    ancestorId: accumulator.ancestorId,
                    descendantId: newCategory.id,
                    depth: accumulator.depth + 1
                }));

                newPaths.push({
                    ancestorId: parentId,
                    descendantId: newCategory.id,
                    depth: 1,
                });

                await tx.categoryClosureTable.createMany({
                    data: newPaths,
                });

                return newCategory;
            }

        })

    }
}