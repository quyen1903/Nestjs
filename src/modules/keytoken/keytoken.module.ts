import { Module } from "@nestjs/common";
import { PrismaModule } from "src/services/prisma/prisma.module";
import { KeyTokenService } from "./keytoken.service";
import { ApiKeyService } from "./api-key.service";
@Module({
    imports:[PrismaModule],
    providers:[KeyTokenService, ApiKeyService],
    exports:[KeyTokenService, ApiKeyService]
})
export class KeyTokenModule{}