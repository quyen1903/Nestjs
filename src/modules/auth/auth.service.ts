import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { KeyTokenService } from '../keytoken/keytoken.service';
import * as crypto from 'crypto';
import { Sex, UserSocial } from '@prisma/client';

@Injectable()
export class AuthService {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly jwtService: JwtService,
        private readonly keyTokenService: KeyTokenService,
    ) {};

    /**
     * 
     * @param password original password
     * @param salt random string
     * @returns hashed password, which had been add salt to hash, almost impossible to brute force
    */
    hashPassword(password:string, salt:string):Promise<string> {
        return new Promise((resolve, reject) => {
            crypto.pbkdf2(password, salt, 100,64,'sha512', (err, key) => {
                if (err) return  reject(err)
                resolve(key.toString('hex'));
            })
        });
    }

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
    generateKeyPair(): {
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
    }

    // async findOrCreateGoogleUser(profile: UserSocial) {
    //     const { email, provider } = profile;

    //     // Check if user exists
    //     let user = await this.prismaService.userSocial.findUnique({
    //         where: { email, provider }
    //     });

    //     if (!user) {
    //         // Create new user if doesn't exist
    //         user = await this.prismaService.userSocial.create({
    //             data: {
    //                 email,
    //                 name: `${firstName} ${lastName}`,
    //                 avatar: picture,
    //                 isActive: true,
    //                 password: '', // Required field
    //                 salt: '', // Required field
    //                 phone: '', // Required field
    //                 sex: Sex.FEMALE, // Required field
    //                 dateOfBirth: new Date(), // Required field
    //             }
    //         });
    //     }

    //     // Generate tokens
    //     const { publicKey, privateKey } = this.generateKeyPair();
    //     const {accessToken, refreshToken} = this.createTokenPair(newUserAuth.userId, newUserAuth.userName)


    //     // Create or update key token
    //     await this.keyTokenService.createKeyToken({
    //         accountId: user.id,
    //         publicKey,
    //         refreshToken: refreshToken,
    //         roles: 'USER'
    //     });

    //     return {
    //         user: {
    //             id: user.id,
    //             email: user.email,
    //             name: user.name,
    //             avatar: user.avatar
    //         },
    //         accessToken,
    //         refreshToken
    //     };
    // }
} 