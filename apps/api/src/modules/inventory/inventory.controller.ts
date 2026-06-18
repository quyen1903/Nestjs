import { Controller, UseGuards, Body, Post } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { RoleGuard } from '../auth/auth-role.guard';
import { AccountType } from 'prisma/generated/prisma';
import { Roles } from '../auth/roles.decorator';
import { InventoryDTO } from './dto/inventory.dto';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { AuthRequest } from '../auth/dto/auth-request.dto';
import { JWTdecode } from 'src/shared/interfaces/jwt.interface';
@Controller('inventory')
export class InventoryController {
    constructor(private readonly inventoryService: InventoryService) {};

    @Post('')
    @UseGuards(AccessTokenGuard, RoleGuard)
    @Roles(AccountType.SHOP)
    addStockToInventory(
        @Body() payload: InventoryDTO,
        @AuthRequest('account') account: JWTdecode
    ){
        return this.inventoryService.addStockToInventory(payload, account.accountId)
    }
}
