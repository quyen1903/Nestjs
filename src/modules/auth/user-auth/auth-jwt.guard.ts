import { 
    CanActivate, 
    ExecutionContext, 
    Injectable, 
    UnauthorizedException, 
    ForbiddenException, 
    BadRequestException, 
    InternalServerErrorException 
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserKeyTokenService } from './user-auth.keytoken';
@Injectable()
export class UserAuthGuard implements CanActivate {
    constructor(
        private readonly jwtService: JwtService,
        private readonly userKeyTokenService: UserKeyTokenService
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const accountId = request.headers['x-client-id'] as string;

        if (!accountId) throw new UnauthorizedException('Invalid Request, missing client ID');

        // Find KeyStore
        const keyStore = await this.userKeyTokenService.findByAccountId(accountId);
        if (!keyStore) throw new UnauthorizedException('KeyStore not found');


        // Check Refresh Token
        const refreshToken = request.headers['x-rtoken-id'] as string;
        if (refreshToken) {
            const decodedUser = this.jwtService.verify(refreshToken, {publicKey:keyStore.publicKey});
            if (accountId !== decodedUser['accountId']) throw new UnauthorizedException('Invalid User ID');
            console.log("decoded User", decodedUser),
            request['account'] = decodedUser;
            request['keyStore'] = keyStore;

            return true;
        }

        // Check Access Token
        const accessToken = request.headers['authorization'] as string;
        if (!accessToken) throw new UnauthorizedException('Invalid Request');

        try {
            const decodedUser = this.jwtService.verify(refreshToken, {publicKey:keyStore.publicKey});
            if (accountId !== decodedUser['accountId']) throw new UnauthorizedException('Invalid User ID');
            console.log("decoded User", decodedUser),
            request['account'] = decodedUser;
            request['keyStore'] = keyStore;

        } catch (error) {
            console.error('AuthGuard Error:', error); // Ghi log để debug
            throw new BadRequestException('wrong access or refresh token, please relogin');
        }

        return true;
    }
}
