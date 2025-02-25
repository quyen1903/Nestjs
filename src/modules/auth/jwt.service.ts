import { Injectable } from '@nestjs/common';
import jwt from 'jsonwebtoken';
import { BadRequestException } from '@nestjs/common';

@Injectable()
export class JwtService {
    private signToken(payload: object, privateKey: string, expiresIn: string): string {
        return jwt.sign(payload, privateKey, {
            expiresIn,
            algorithm: 'RS256',
        });
    }

    createToken(payload: { accountId: string; email: string; role: string },publicKey: string,privateKey: string,):{
        accessToken: string,
        refreshToken: string
    } {
        try {
            const accessToken = this.signToken(payload, privateKey, '1d');
            const refreshToken = this.signToken(payload, privateKey, '7d');

            jwt.verify(accessToken, publicKey, (err, decode) => {
                if (err) {
                throw new BadRequestException('JWT verify error');
                }
                console.log(`decode verify`, decode);
            });

            return { accessToken, refreshToken };
        } catch (error) {
            console.error('Authentication Utilities error:::', error);
            throw new BadRequestException('Error creating token pair');
        }
    }

        verifyToken(token: string, publicKey: string) {
        return jwt.verify(token, publicKey);
    }
}
