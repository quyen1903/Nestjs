import { Controller, Post } from "@nestjs/common";
import { ApiKeyService } from "./api-key.service";
@Controller('api')
export class ApiController{
    constructor(private readonly apikeyService: ApiKeyService){}

    @Post('createApiKey')
    createKey(){
        return this.apikeyService.createAPIKey()
    }
}