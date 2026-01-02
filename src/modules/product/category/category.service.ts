import { PrismaService } from "src/services/prisma/prisma.service"
export class CategoryProduct{
    constructor(private readonly prismaservice: PrismaService){}

    async createCategory(name: string, parentId?: string){
        return await this.prismaservice.$transaction(async (tx)=>{
            // //1 create category
            // const createCategory = await tx.category.create({
            //     data:{name}
            // })

            // //2
            // await tx.categoryClosureTable
        })
    }
}