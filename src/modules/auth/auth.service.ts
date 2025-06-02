import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { JwtService } from './jwt.service';
import { KeyTokenService } from '../keytoken/keytoken.service';
import * as crypto from 'crypto';
import { Sex } from '@prisma/client';

@Injectable()
export class AuthService {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly jwtService: JwtService,
        private readonly keyTokenService: KeyTokenService,
    ) {}

    async findOrCreateGoogleUser(profile: any) {
        const { email, firstName, lastName, picture } = profile;

        // Check if user exists
        let user = await this.prismaService.user.findUnique({
            where: { email }
        });

        if (!user) {
            // Create new user if doesn't exist
            user = await this.prismaService.user.create({
                data: {
                    email,
                    name: `${firstName} ${lastName}`,
                    avatar: picture,
                    isActive: true,
                    password: '', // Required field
                    salt: '', // Required field
                    phone: '', // Required field
                    sex: Sex.FEMALE, // Required field
                    dateOfBirth: new Date(), // Required field
                }
            });
        }

        // Generate tokens
        const { publicKey, privateKey } = this.generateKeyPair();
        const tokens = this.jwtService.createToken(
            { accountId: user.id, email: user.email, role: 'USER' },
            publicKey,
            privateKey
        );

        // Create or update key token
        await this.keyTokenService.createKeyToken({
            accountId: user.id,
            publicKey,
            refreshToken: tokens.refreshToken,
            roles: 'USER'
        });

        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                avatar: user.avatar
            },
            tokens
        };
    }

    private generateKeyPair() {
        const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
            modulusLength: 4096,
            publicKeyEncoding: {
                type: 'pkcs1',
                format: 'pem'
            },
            privateKeyEncoding: {
                type: 'pkcs1',
                format: 'pem'
            }
        });
        return { publicKey, privateKey };
    }
} 