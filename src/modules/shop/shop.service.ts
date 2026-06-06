import { 
    Injectable,
    BadRequestException,
    UnauthorizedException,
    ForbiddenException,
    InternalServerErrorException
} from '@nestjs/common';
import crypto from 'crypto';
import { DrizzleService } from 'src/database/drizzle.service';
import { ProducerService } from 'src/services/kafka/services/producer.service';
import { JwtService } from '@nestjs/jwt';
// import { RegisterShopDTO } from './dto/register.dto';
import { AuthService } from '../auth/auth.service';
import { AccountType, AuthMethod } from 'src/database/types';
import { getInfoData } from 'src/shared/utils';

@Injectable()
export class ShopService extends AuthService {
  constructor(drizzleService: DrizzleService,
    jwtService: JwtService,
    producerService: ProducerService,
  ) {
    super(drizzleService, jwtService, producerService);
  }

  protected override createTokenPair(accountId: string, email: string, privateKey: string) {
    const payload = {
      accountId,
      email,
      role: 'SHOP',
      permissions: ['order:read', 'order:write']
    };

    const accessToken = this.jwtService.sign(payload, {
      privateKey,
      algorithm: 'RS256',
      expiresIn: '1h',
    });

    const refreshToken = this.jwtService.sign(payload, {
      privateKey,
      algorithm: 'RS256',
      expiresIn: '6h',
    });

    return { accessToken, refreshToken };
  }

  // async register(register: RegisterShopDTO): Promise<{
  //   shop: object;
  //   accessToken: string;
  //   refreshToken: string;
  // }> {
  //   // Check if shop already exists
  //   const shopHolder = await this.drizzleService.account.findFirst({
  //     where: {
  //       accountType: AccountType.SHOP,
  //       authentication: {
  //         email: register.email
  //       }
  //     },
  //     include: {
  //       authentication: true,
  //       profile: true,
  //       shopBusiness: true,
  //       security: true
  //     }
  //   });
    
  //   if (shopHolder) throw new BadRequestException('Shop already exists');

  //   const currentTime = BigInt(Date.now());
  //   const salt = crypto.randomBytes(32).toString('hex');
  //   const passwordHashed = await this.hashPassword(register.password, salt);

  //   // Create account and related data in transaction
  //   const result = await this.drizzleService.$transaction(async (tx) => {
  //     // 1. Create main account
  //     const newAccount = await tx.account.create({
  //       data: {
  //         accountType: AccountType.SHOP,
  //         createdAt: currentTime,
  //         updatedAt: currentTime
  //       }
  //     });

  //     // 2. Create authentication
  //     await tx.accountAuthentication.create({
  //       data: {
  //         accountId: newAccount.id,
  //         email: register.email,
  //         passwordHash: passwordHashed,
  //         passwordSalt: salt,
  //         authMethod: AuthMethod.EMAIL_PASSWORD,
  //         createdAt: currentTime,
  //         updatedAt: currentTime
  //       }
  //     });

  //     // 3. Create profile
  //     await tx.accountProfile.create({
  //       data: {
  //         accountId: newAccount.id,
  //         name: register.name,
  //         createdAt: currentTime,
  //         updatedAt: currentTime
  //       }
  //     });

  //     // 4. Create shop business data
  //     await tx.shopBusiness.create({
  //       data: {
  //         accountId: newAccount.id,
  //         businessName: register.businessName || register.name,
  //         businessType: register.businessType || 'GENERAL',
  //         createdAt: currentTime,
  //         updatedAt: currentTime
  //       }
  //     });

  //     // 5. Create security settings
  //     await tx.accountSecurity.create({
  //       data: {
  //         accountId: newAccount.id,
  //         roles: ['SHOP'],
  //         permissions: ['shop:manage', 'product:manage', 'order:manage'],
  //         createdAt: currentTime,
  //         updatedAt: currentTime
  //       }
  //     });

  //     // 6. Create preferences
  //     await tx.accountPreferences.create({
  //       data: {
  //         accountId: newAccount.id,
  //         createdAt: currentTime,
  //         updatedAt: currentTime
  //       }
  //     });

  //     return newAccount;
  //   });

  //   if (result) {
  //     // Generate tokens
  //     const { publicKey, privateKey } =await this.generateKeyPair();
  //     const { accessToken, refreshToken } = this.createTokenPair(
  //       result.id, 
  //       register.email, 
  //       privateKey
  //     );

  //     if (!accessToken || !refreshToken) {
  //       throw new BadRequestException('Create tokens error!!!!!!');
  //     }

  //     // Create key store
  //     const deviceId = crypto.randomUUID();
  //     const keyStore = await this.upsertKeyStore(result.id, deviceId, publicKey, refreshToken);
  //     if (!keyStore) throw new Error('Cannot generate keytoken');

  //     await this.producerService.produce({
  //       topic: 'registration',
  //       messages: [{
  //         value: `${register.name} shop has been created in our system`
  //       }]
  //     });

  //     return {
  //       shop: getInfoData(['id'], result),
  //       accessToken,
  //       refreshToken
  //     };
  //   }

  //   throw new InternalServerErrorException('Token generation failed');
  // }
}
