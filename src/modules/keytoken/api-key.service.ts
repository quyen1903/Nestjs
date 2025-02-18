import { Injectable } from '@nestjs/common';
import crypto from 'node:crypto';
import { PrismaService } from 'src/services/prisma/prisma.service';

@Injectable()
export class ApiKeyService{
    constructor(private readonly prismaService: PrismaService){}
    
    findById = async (key: string)=>{
        const objectKey = await this.prismaService.aPIkey.findFirst({where: {key}})
        return objectKey
    }
    
    createAPIKey = async()=>{
        const newKey = await this.prismaService.aPIkey.create({
            data:{
                key:crypto.randomBytes(64).toString('hex'),
                status:true,
                permission:['0000']
            }
        })
        return newKey
    }
}

