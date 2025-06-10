import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/services/prisma/prisma.service';
import crypto from 'crypto';

@Injectable()
export class ApiService {
    constructor( private readonly prismaService: PrismaService){}
    findById = async (key: string)=>{
        const objectKey = await this.prismaService.aPIkey.findFirst({where: {key}})
        return objectKey
    }
    
    async createAPIKey(){
        return await this.prismaService.aPIkey.create({
            data:{
                key:crypto.randomBytes(64).toString('hex'),
                status:true,
                permission:['0000'],
                isActive: true
            }
        })
    }
}
