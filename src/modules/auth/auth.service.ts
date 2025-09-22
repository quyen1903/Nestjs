import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { ProducerService } from 'src/services/kafka/services/producer.service';
@Injectable()
export class AuthService {
    constructor(
        protected readonly prismaService: PrismaService,
        protected readonly jwtService: JwtService,
        // private readonly userKeyTokenService: UserKeyTokenService,
        protected readonly producerService: ProducerService
    ) {};

    /**
     * 
     * @param password original password
     * @param salt random string
     * @returns hashed password, which had been add salt to hash, almost impossible to brute force
    */
    protected hashPassword(password:string, salt:string):Promise<string> {
        return new Promise((resolve, reject) => {
            crypto.pbkdf2(password, salt, 100,64,'sha512', (err, key) => {
                if (err) return  reject(err)
                resolve(key.toString('hex'));
            })
        });
    };

    /**
     * 
     * @returns return public key and private key
     * in cryptography
     * public key are use for decrypt and to authorize jwt (this is our use case)
     * private key are use for encrypt and to create jwt (this is our use case)
     * public key are store in database, we drop private key
     * 
     * in both user case, anybody can see public key, it's ok. But dont let any one know your private key
     */
    protected generateKeyPair(): {
        publicKey: string;
        privateKey: string;
    }{
        const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa',{
            modulusLength:4096,
            publicKeyEncoding:{
                type:'pkcs1',
                format:'pem'
            },
            privateKeyEncoding:{
                type:'pkcs1',
                format:'pem'
            }
        })
        return {publicKey, privateKey}
    };

    protected createTokenPair(id: string, deviceId: string, email: string, privateKey: string){
        const payload = {                
            accountId:id, 
            deviceId,
            email,
            role: 'USER'
        };
        
        const accessToken = this.jwtService.sign(payload,  
            {
                privateKey,              
                algorithm: 'RS256',      
                expiresIn: '1h',         
            }
        )

        const refreshToken = this.jwtService.sign(payload,  
            {
                privateKey,              
                algorithm: 'RS256',      
                expiresIn: '6h',         
            }
        )
        return {accessToken, refreshToken}
    };

    protected async upsertKeyStore(
        accountId: string, 
        deviceId: string,
        publicKey: string, 
        refreshToken: string
    ) {
        return await this.prismaService.keyToken.upsert({
            where: {
                authId_deviceId: {
                    authId: accountId,
                    deviceId: deviceId
                }
            },
            update: {
                publicKey,
                refreshToken,
                updatedAt: BigInt(Date.now())
            },
            create: {
                authId: accountId,
                deviceId,
                publicKey,
                refreshToken,
                createdAt: BigInt(Date.now()),
                updatedAt: BigInt(Date.now())
            }
        });
    }
} 