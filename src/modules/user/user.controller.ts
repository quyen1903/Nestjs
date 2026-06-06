import { Body, Controller, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { UserService } from "./user.service";
import { RegisterUserDTO } from "./dto/register.dto";
import { ApiEndpoint } from "src/shared/swagger/api-docs.decorator";
@Controller('user')
@ApiTags('User')
export class ShopController{
    constructor( private readonly userService: UserService ){}

    @Post('registerManual')
    @ApiEndpoint({
        summary: 'Register a user with email and password',
        body: { type: RegisterUserDTO },
        responses: [{ status: 201, description: 'User registered' }],
    })
    registerUser(@Body() body: RegisterUserDTO){
        return this.userService.registerManual(body)
    }
    
}
