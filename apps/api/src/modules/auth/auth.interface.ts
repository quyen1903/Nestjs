import { LoginUserManualDTO } from "./user-auth/dto/login.dto";
interface AuthService {
    // other method signatures  

    handleRefreshToken(oldRefreshToken: string): Promise<{ accessToken: string; refreshToken: string }> ;
    loginmanual(dto: LoginUserManualDTO): Promise<{ accessToken: string; refreshToken: string }>;
    logout(refreshToken: string): Promise<void>;
}