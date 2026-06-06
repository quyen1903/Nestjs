import { IsNotEmpty, IsString, IsInt, IsArray, IsBoolean, IsEnum, ArrayMinSize} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";


enum AppliesTo {
    ALL = 'all',
    SPECIFIC = 'specific',
}

export class CreateDiscountDTO {
    @ApiProperty({ example: 'Summer Sale' })
    @IsNotEmpty()
    @IsString()
    discountName: string;

    @ApiPropertyOptional({ example: 'Discount campaign for summer products' })
    @IsString()
    discountDescription: string;

    @ApiProperty({ example: 'percentage', enum: ['fixed_amount', 'percentage'] })
    @IsNotEmpty()
    @IsString()
    discountType: string;

    @ApiProperty({ example: 10 })
    @IsInt()
    @IsNotEmpty()
    discountValue: number;

    @ApiProperty({ example: 'SUMMER2026' })
    @IsNotEmpty()
    @IsString()
    discountCode: string;

    @ApiProperty({ example: '2026-06-01T00:00:00.000Z' })
    @IsString()
    @IsNotEmpty()
    discountStartDates: string;

    @ApiProperty({ example: '2026-06-30T23:59:59.000Z' })
    @IsString()
    @IsNotEmpty()
    discountEndDates: string;

    @ApiProperty({ example: 1000 })
    @IsInt()
    @IsNotEmpty()
    discountMaxUses: number;

    @ApiProperty({ example: 0 })
    @IsInt()
    @IsNotEmpty()
    discountUsesCount: number;

    @ApiProperty({ example: [], type: [String] })
    @IsArray()
    @IsString({ each: true })
    @ArrayMinSize(1)
    discountUsersUsed: string[];

    @ApiProperty({ example: 1 })
    @IsInt()
    @IsNotEmpty()
    discountMaxUsesPerUser: number;

    @ApiProperty({ example: 100 })
    @IsInt()
    @IsNotEmpty()
    discountMinOrderValue: number;

    @ApiProperty({ example: true })
    @IsBoolean()
    discountIsActive: boolean;

    @ApiProperty({ enum: AppliesTo, example: AppliesTo.ALL })
    @IsNotEmpty()
    @IsEnum(AppliesTo)
    discountAppliesTo: AppliesTo;

    @ApiProperty({ example: ['sku_123'], type: [String] })
    @IsArray()
    @IsString({ each: true })  // "each" tells class-validator to run the validation on each item of the array
    @ArrayMinSize(1)
    discountProductIds: string[];
}
