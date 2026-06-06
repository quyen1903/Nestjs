import { Module } from "@nestjs/common";
import { DrizzleModule } from "src/database/drizzle.module";
import { KeyTokenService } from "./keytoken.service";
import { ApiKeyService } from "./api-key.service";
import { ApiController } from "./api.controller";

@Module({
    imports:[DrizzleModule,],
    controllers:[ApiController],
    providers:[KeyTokenService, ApiKeyService],
    exports:[KeyTokenService, ApiKeyService]
})
export class KeyTokenModule{}