import { Body, Controller, Post, Get, Query, UseGuards, Req } from "@nestjs/common";
import { UserService } from "./user.service";
import { RegisterUserDTO } from "./dto/register.dto";
@Controller('user')
export class ShopController{
    constructor( private readonly userService: UserService ){}

    @Post('registerManual')
    registerUser(
        @Body() body: RegisterUserDTO,
        @Req() req: Request
    ){
        console.log(req)
        return this.userService.registerManual(body)
    }
    
}