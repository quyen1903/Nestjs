import { Controller, Post } from "@nestjs/common";
import { ApiExcludeController } from "@nestjs/swagger";
import { ApiKeyService } from "./api-key.service";

@Controller('api')
@ApiExcludeController()
export class ApiController{
    constructor(private readonly apikeyService: ApiKeyService){}

    // @Post('createApiKey')
    // createKey(){
    //     return this.apikeyService.createAPIKey()
    // }
}
