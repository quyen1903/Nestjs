import { Controller, UseGuards, Body, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { RoleGuard } from '../auth/auth-role.guard';
import { AccountType } from 'src/database/types';
import { Roles } from '../auth/roles.decorator';
import { InventoryDTO } from './dto/inventory.dto';
import { JwtAccessAuthGuard } from '../auth/guards/jwt-access-auth.guard';
import { ApiEndpoint } from 'src/shared/swagger/api-docs.decorator';
@Controller('inventory')
@ApiTags('Inventory')
export class InventoryController {
    constructor(private readonly inventoryService: InventoryService) {};

    @Post('')
    @UseGuards(JwtAccessAuthGuard, RoleGuard)
    @Roles(AccountType.SHOP)
    @ApiEndpoint({
        summary: 'Add stock to inventory',
        auth: true,
        body: { type: InventoryDTO },
        responses: [{ status: 201, description: 'Inventory stock updated' }],
    })
    addStockToInventory(@Body() payload: InventoryDTO){
        return this.inventoryService.addStockToInventory(payload)
    }
}
