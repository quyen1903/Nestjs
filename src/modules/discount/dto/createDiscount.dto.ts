import { IsNotEmpty, IsString, IsInt, IsArray, IsBoolean, IsEnum, ArrayMinSize} from "class-validator";


enum AppliesTo {
    ALL = 'all',
    SPECIFIC = 'specific',
}

export class CreateDiscountDTO {
    @IsNotEmpty()
    @IsString()
    discountName: string;

    @IsString()
    discountDescription: string;

    @IsNotEmpty()
    @IsString()
    discountType: string;

    @IsInt()
    @IsNotEmpty()
    discountValue: number;

    @IsNotEmpty()
    @IsString()
    discountCode: string;

    @IsString()
    @IsNotEmpty()
    discountStartDates: string;

    @IsString()
    @IsNotEmpty()
    discountEndDates: string;

    @IsInt()
    @IsNotEmpty()
    discountMaxUses: number;

    @IsInt()
    @IsNotEmpty()
    discountUsesCount: number;

    @IsArray()
    @IsString({ each: true })
    @ArrayMinSize(1)
    discountUsersUsed: string[];

    @IsInt()
    @IsNotEmpty()
    discountMaxUsesPerUser: number;

    @IsInt()
    @IsNotEmpty()
    discountMinOrderValue: number;

    @IsBoolean()
    discountIsActive: boolean;

    @IsNotEmpty()
    @IsEnum(AppliesTo)
    discountAppliesTo: AppliesTo;

    @IsArray()
    @IsString({ each: true })  // "each" tells class-validator to run the validation on each item of the array
    @ArrayMinSize(1)
    discountProductIds: string[];
}