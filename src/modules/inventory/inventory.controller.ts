import { Controller, UseGuards, Body, Post } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { RoleGuard } from '../auth/auth-role.guard';
import { Role } from 'src/shared/enums/role.enum';
import { Roles } from '../auth/roles.decorator';
import { InventoryDTO } from './dto/inventory.dto';
import { AccessTokenGuard } from '../auth/access-token.guard';
@Controller('inventory')
export class InventoryController {
    constructor(private readonly inventoryService: InventoryService) {};

    @Post('')
    @UseGuards(AccessTokenGuard, RoleGuard)
    @Roles(Role.Shop)
    addStockToInventory(@Body() payload: InventoryDTO){
        return this.inventoryService.addStockToInventory(payload)
    }
}
