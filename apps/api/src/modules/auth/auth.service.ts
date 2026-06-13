import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'node:crypto';
import { ProducerService } from 'src/services/kafka/services/producer.service';
import { promisify } from 'util';
import { randomBytes } from 'node:crypto';
import { buffer } from 'node:stream/consumers';

@Injectable()
export class AuthService {
    protected readonly logger = new Logger(this.constructor.name);

    constructor(
        protected readonly prismaService: PrismaService,
        protected readonly jwtService: JwtService,
        protected readonly producerService: ProducerService
    ) {};

    /**
     * 
     * @param password original password
     * @param salt random string
     * @returns hashed password, which had been add salt to hash, almost impossible to brute force
    */
    private readonly hashPasswordAsync = promisify(crypto.argon2);
    protected hashPassword(password:string, salt:string):Promise<string> {
        return this.hashPasswordAsync('argon2id',{
            message:password,
            nonce: salt,
            parallelism: 4,
            tagLength: 64,
            memory: 65536,
            passes: 3,
        }).then(buffer => buffer.toString('hex')); 
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
     * create one generateKeyPairAsync function, which return promise, to generate key pair asynchronously, 
     * because crypto.generateKeyPair is callback-based, we need to promisify it to use async/await syntax
     */
    private readonly generateKeyPairAsync = promisify(crypto.generateKeyPair);
    protected generateKeyPair(): Promise<{
        publicKey: string;
        privateKey: string;
    }> {
        return this.generateKeyPairAsync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: {
                type: 'pkcs1',
                format: 'pem'
            },
            privateKeyEncoding: {
                type: 'pkcs1',
                format: 'pem'
            }
        });
    }

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