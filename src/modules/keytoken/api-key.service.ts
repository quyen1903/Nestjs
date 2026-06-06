import { Injectable } from '@nestjs/common';
import crypto from 'node:crypto';
import { DrizzleService } from 'src/database/drizzle.service';

@Injectable()
export class ApiKeyService{
    constructor(private readonly drizzleService: DrizzleService){}
    
    // findById = async (key: string)=>{
    //     const objectKey = await this.drizzleService.aPIkey.findFirst({where: {key}})
    //     return objectKey
    // }
    
    // createAPIKey = async()=>{
    //     const newKey = await this.drizzleService.aPIkey.create({
    //         data:{
    //             key:crypto.randomBytes(64).toString('hex'),
    //             status:true,
    //             permission:['0000']
    //         }
    //     })
    //     return newKey
    // }
}

