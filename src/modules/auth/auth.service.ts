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

        private createTokenPair(userId: string, userName: string){
        const { privateKey } = this.generateKeyPair();

        const payload = {                
            accountId:userId, 
            username: userName,
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
    }

        hashPassword(password:string, salt:string):Promise<string> {
            return new Promise((resolve, reject) => {
                crypto.pbkdf2(password, salt, 100,64,'sha512', (err, key) => {
                    if (err) return  reject(err)
                    resolve(key.toString('hex'));
                })
            });
        }
    
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