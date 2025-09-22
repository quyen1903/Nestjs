import { Body, Controller, Post, Get, Query, UseGuards } from "@nestjs/common";
import { UserService } from "./user.service";
import { RegisterUserDTO } from "./dto/register.dto";
@Controller('user')
export class ShopController{
    constructor( private readonly userService: UserService ){}

    @Post('registerManual')
    registerUser(@Body() body: RegisterUserDTO){
        return this.userService.registerManual(body)
    }
    
}