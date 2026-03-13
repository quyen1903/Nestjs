import { UsernameValidator } from "src/shared/validators/username.validator";
import { PasswordValidator } from "src/shared/validators/password.validator";
import { IsEmail, IsOptional, IsString, IsEnum, MinLength, MaxLength, IsPhoneNumber } from "class-validator";
import { Transform } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

export class RegisterShopDTO {
    // Profile Information (AccountProfile)
    @MinLength(2, { message: 'Name must be at least 2 characters long' })
    @MaxLength(100, { message: 'Name cannot exceed 100 characters' })
    @ApiProperty({
        example: 'quyen nguyen',
        description: 'Shop name',
        required:true
    })
    name: string;

    @IsOptional()
    @IsPhoneNumber(null, { message: 'Invalid phone number format' })
    @ApiProperty({
        example: '+84984295387',
        description: 'Shop phone',
        required:false
    })
    phone?: string;

    @IsOptional()
    @IsString()
    @MaxLength(500, { message: 'Address cannot exceed 500 characters' })
    @ApiProperty({
        example: '17A cong hoa phuong 4 quan tan binh',
        description: 'Shop Address',
        required:false
    })
    address?: string;

    @IsOptional()
    @IsString()
    @ApiProperty({
        example: 'UTC +8',
        description: 'Shop name',
        required:false
    })
    timezone?: string;

    @IsOptional()
    @IsString()
    @IsEnum(['en', 'vi', 'fr'], { message: 'Language must be one of: en, vi, fr' })
    @ApiProperty({
        example: 'fr',
        description: 'Shop language'
    })
    language?: string;

    // Authentication Information (AccountAuthentication)
    @IsEmail({}, { message: 'Invalid email format' })
    @Transform(({ value }) => value?.toLowerCase().trim())
    @ApiProperty({
        example: 'quinn@example.com',
        description: 'Shop email address',
        required:true
    })
    email: string;

    @PasswordValidator()
    @ApiProperty({
        example: 'SecurePass123!',
        description: 'Shop password',
        required:true
    })
    password: string;

    @IsOptional()
    @IsString()
    @Transform(({value})=>value?.toLowerCase().trim())
    @UsernameValidator()
    @ApiProperty({ 
        example: 'quinn123', 
        description: 'Unique username for the account',
        required: false
    })
    username?: string;

    // Business Information (ShopBusiness)
    @IsString()
    @MinLength(2, { message: 'Business name must be at least 2 characters long' })
    @MaxLength(200, { message: 'Business name cannot exceed 200 characters' })
    @ApiProperty({ 
        example: 'cong ty xuat nhap khau blabla', 
        description: 'Unique business name for the account',
        required:true
    })
    businessName: string;

    @IsString()
    @MaxLength(100, { message: 'Business type cannot exceed 100 characters' })
    @ApiProperty({ 
        example: '', 
        description: 'Business type for the account',
        required:true
    })
    businessType: string;

    @IsOptional()
    @IsString()
    @MaxLength(50, { message: 'Tax ID cannot exceed 50 characters' })
    @ApiProperty({ 
        example: 'limited liability company/ Société Anonyme', 
        description: 'Business type for the account',
        required: false 
    })
    taxId?: string;

    @IsOptional()
    @IsString()
    @MaxLength(500, { message: 'Business address cannot exceed 500 characters' })
    @ApiProperty({ 
        example: 'avenue de wagram 17e arrondissement paris', 
        description: 'Business type for the account',
        required: false 
    })
    businessAddress?: string;

    // Preferences (AccountPreferences)
    @IsOptional()
    @IsString()
    @IsEnum(['USD', 'VND', 'EUR'], { message: 'Currency must be one of: USD, VND , EUR' })
    @ApiProperty({ 
        example: 'USD', 
        description: 'Currency',
        required: false 
    })
    currency?: string = 'USD';

    @IsOptional()
    @IsString()
    @IsEnum(['light', 'dark'], { message: 'Theme must be light or dark' })
    @ApiProperty({ 
        example: 'dark', 
        description: 'theme ',
        required: false 
    })
    theme?: string = 'light';

    // Notification preferences
    @IsOptional()
    @ApiProperty({ 
        example: false, 
        description: 'push or not email notification ',
        required: false 
    })
    emailNotifications?: boolean = true;

    @IsOptional()
    @ApiProperty({ 
        example: false, 
        description: 'on or off sms notification ',
        required: false 
    })
    smsNotifications?: boolean = false;

    @IsOptional()
    @ApiProperty({ 
        example: false, 
        description: 'push or not email notification ',
        required: false 
    })
    pushNotifications?: boolean = true;
}
