import { IsEmail, IsString, IsOptional, MinLength } from "class-validator";
import { Transform } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import { PasswordValidator } from "src/shared/validators/password.validator";

export class LoginManualDTO {
    @IsEmail({}, { message: 'Invalid email format' })
    @Transform(({ value }) => value?.toLowerCase().trim())
    @ApiProperty({ 
        example: 'quinn@example.com',
        description: 'User email address'
    })
    email: string;

    @IsString()
    @PasswordValidator()
    @ApiProperty({ 
        example: 'SecurePass123!',
        description: 'User password'
    })
    password: string;

    // Optional device identification for session management
    @IsOptional()
    @IsString()
    @ApiProperty({ 
        example: 'web-browser-chrome',
        description: 'Device identifier for session management',
        required: false
    })
    deviceId?: string;

    @IsOptional()
    @IsString()
    @ApiProperty({ 
        example: 'iPhone 12 Pro - Chrome',
        description: 'Human readable device name',
        required: false
    })
    deviceName?: string;

    // Optional for security tracking
    @IsOptional()
    @IsString()
    @ApiProperty({ 
        example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        description: 'Browser user agent for security tracking',
        required: false
    })
    userAgent?: string;

    @IsOptional()
    @IsString()
    @ApiProperty({ 
        example: '192.168.1.100',
        description: 'Client IP address for security tracking',
        required: false
    })
    ipAddress?: string;
}
