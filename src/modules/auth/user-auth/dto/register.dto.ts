import { Sex } from "@prisma/client";
import { PasswordValidator } from "src/shared/validators/password.validator";
import { IsOptional, IsPhoneNumber, IsString, IsNotEmpty, IsEmail, IsEnum, MinLength, MaxLength, IsDateString, IsDate } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";

export class RegisterUserDTO {
    // Authentication Information (AccountAuthentication)
    @IsOptional()
    @IsString()
    @MinLength(3, { message: 'Username must be at least 3 characters long' })
    @MaxLength(50, { message: 'Username cannot exceed 50 characters' })
    @ApiProperty({ 
        example: 'quinn123', 
        description: 'Unique username for the account',
        required: false 
    })
    username?: string;

    @IsNotEmpty()
    @IsEmail({}, { message: 'Invalid email format' })
    @Transform(({ value }) => value?.toLowerCase().trim())
    @ApiProperty({ 
        example: 'quinn@example.com',
        description: 'User email address'
    })
    email: string;

    @IsNotEmpty()
    @PasswordValidator()
    @ApiProperty({ 
        example: 'SecurePass123!',
        description: 'User password with strong validation'
    })
    password: string;

    // Profile Information (AccountProfile)
    @IsNotEmpty()
    @IsString()
    @MinLength(1, { message: 'Name is required' })
    @MaxLength(100, { message: 'Name cannot exceed 100 characters' })
    @ApiProperty({ 
        example: 'Quinn Doe',
        description: 'Full name of the user'
    })
    name: string;

    @IsOptional()
    @IsString()
    @MaxLength(500, { message: 'Avatar URL cannot exceed 500 characters' })
    @ApiProperty({ 
        example: 'https://example.com/avatars/quinn.png',
        description: 'Profile avatar image URL',
        required: false
    })
    avatar?: string;

    @IsOptional()
    @IsPhoneNumber(null, { message: 'Invalid phone number format' })
    @ApiProperty({ 
        example: '+84925020030',
        description: 'Phone number with country code',
        required: false
    })
    phone?: string;

    @IsOptional()
    @IsString()
    @MaxLength(500, { message: 'Address cannot exceed 500 characters' })
    @ApiProperty({ 
        example: '123 Main St, Ho Chi Minh City, Vietnam',
        description: 'User address',
        required: false
    })
    address?: string;

    @IsOptional()
    @IsString()
    @ApiProperty({ 
        example: 'Asia/Ho_Chi_Minh',
        description: 'User timezone',
        required: false
    })
    timezone?: string;

    @IsOptional()
    @IsString()
    @IsEnum(['en', 'vi', 'th', 'id'], { message: 'Language must be one of: en, vi, th, id' })
    @ApiProperty({ 
        example: 'en',
        enum: ['en', 'vi', 'th', 'id'],
        description: 'Preferred language',
        required: false,
        default: 'en'
    })
    language?: string = 'en';

    // User Behavior Information
    @IsOptional()
    @IsDateString({}, { message: 'Date of birth must be a valid date string (YYYY-MM-DD)' })
    @Type(() => Date)
    @Transform(({ value }) => {
        if (value) {
            const date = new Date(value);
            if (date > new Date()) {
                throw new Error('Date of birth cannot be in the future');
            }
            return date;
        }
        return value;
    })
    @ApiProperty({ 
        example: '1995-08-15',
        description: 'Date of birth in YYYY-MM-DD format',
        type: 'string',
        format: 'date',
        required: false
    })
    dateOfBirth?: Date;

    @IsOptional()
    @IsEnum(Sex, { message: 'Sex must be MALE or FEMALE' })
    @ApiProperty({ 
        example: 'FEMALE',
        enum: Sex,
        description: 'User gender',
        required: false,
        default: 'FEMALE'
    })
    sex?: Sex = Sex.FEMALE;

    // Preferences (AccountPreferences)
    @IsOptional()
    @IsString()
    @IsEnum(['USD', 'VND', 'THB', 'IDR'], { message: 'Currency must be one of: USD, VND, THB, IDR' })
    @ApiProperty({ 
        example: 'USD',
        enum: ['USD', 'VND', 'THB', 'IDR'],
        description: 'Preferred currency',
        required: false,
        default: 'USD'
    })
    currency?: string = 'USD';

    @IsOptional()
    @IsString()
    @IsEnum(['light', 'dark'], { message: 'Theme must be light or dark' })
    @ApiProperty({ 
        example: 'light',
        enum: ['light', 'dark'],
        description: 'UI theme preference',
        required: false,
        default: 'light'
    })
    theme?: string = 'light';

    @IsOptional()
    @IsString()
    @IsEnum(['public', 'private', 'friends'], { message: 'Profile visibility must be public, private, or friends' })
    @ApiProperty({ 
        example: 'public',
        enum: ['public', 'private', 'friends'],
        description: 'Profile visibility setting',
        required: false,
        default: 'public'
    })
    profileVisibility?: string = 'public';

    // Notification preferences
    @IsOptional()
    @ApiProperty({ 
        example: true,
        description: 'Enable email notifications',
        required: false,
        default: true
    })
    emailNotifications?: boolean = true;

    @IsOptional()
    @ApiProperty({ 
        example: false,
        description: 'Enable SMS notifications',
        required: false,
        default: false
    })
    smsNotifications?: boolean = false;

    @IsOptional()
    @ApiProperty({ 
        example: true,
        description: 'Enable push notifications',
        required: false,
        default: true
    })
    pushNotifications?: boolean = true;

    @IsOptional()
    @ApiProperty({ 
        example: false,
        description: 'Allow data sharing',
        required: false,
        default: false
    })
    dataSharing?: boolean = false;

    // Device information (for session management)
    @IsOptional()
    @IsString()
    @ApiProperty({ 
        example: 'iPhone 12 Pro',
        description: 'Device name for session tracking',
        required: false
    })
    deviceName?: string;
}
