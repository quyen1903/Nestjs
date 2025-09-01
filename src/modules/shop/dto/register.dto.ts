import { UsernameValidator } from "src/shared/validators/username.validator";
import { PasswordValidator } from "src/shared/validators/password.validator";
import { IsEmail, IsOptional, IsString, IsEnum, MinLength, MaxLength, IsPhoneNumber } from "class-validator";
import { Transform } from "class-transformer";

export class RegisterShopDTO {
    // Profile Information (AccountProfile)
    @UsernameValidator()
    @MinLength(2, { message: 'Name must be at least 2 characters long' })
    @MaxLength(100, { message: 'Name cannot exceed 100 characters' })
    name: string;

    @IsOptional()
    @IsPhoneNumber(null, { message: 'Invalid phone number format' })
    phone?: string;

    @IsOptional()
    @IsString()
    @MaxLength(500, { message: 'Address cannot exceed 500 characters' })
    address?: string;

    @IsOptional()
    @IsString()
    timezone?: string;

    @IsOptional()
    @IsString()
    @IsEnum(['en', 'vi', 'fr'], { message: 'Language must be one of: en, vi, fr' })
    language?: string;

    // Authentication Information (AccountAuthentication)
    @IsEmail({}, { message: 'Invalid email format' })
    @Transform(({ value }) => value?.toLowerCase().trim())
    email: string;

    @PasswordValidator()
    password: string;

    @IsOptional()
    @IsString()
    @MinLength(3, { message: 'Username must be at least 3 characters long' })
    @MaxLength(50, { message: 'Username cannot exceed 50 characters' })
    username?: string;

    // Business Information (ShopBusiness)
    @IsString()
    @MinLength(2, { message: 'Business name must be at least 2 characters long' })
    @MaxLength(200, { message: 'Business name cannot exceed 200 characters' })
    businessName: string;

    @IsString()
    @MaxLength(100, { message: 'Business type cannot exceed 100 characters' })
    businessType: string;

    @IsOptional()
    @IsString()
    @MaxLength(50, { message: 'Tax ID cannot exceed 50 characters' })
    taxId?: string;

    @IsOptional()
    @IsString()
    @MaxLength(500, { message: 'Business address cannot exceed 500 characters' })
    businessAddress?: string;

    // Preferences (AccountPreferences)
    @IsOptional()
    @IsString()
    @IsEnum(['USD', 'VND', 'EUR'], { message: 'Currency must be one of: USD, VND , EUR' })
    currency?: string = 'USD';

    @IsOptional()
    @IsString()
    @IsEnum(['light', 'dark'], { message: 'Theme must be light or dark' })
    theme?: string = 'light';

    // Notification preferences
    @IsOptional()
    emailNotifications?: boolean = true;

    @IsOptional()
    smsNotifications?: boolean = false;

    @IsOptional()
    pushNotifications?: boolean = true;
}
