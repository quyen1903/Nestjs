import { Controller, UseGuards, Body, Post } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { RoleGuard } from '../auth/auth-role.guard';
import { Role } from 'src/shared/enums/role.enum';
import { Roles } from '../auth/roles.decorator';
import { InventoryDTO } from './dto/inventory.dto';
import { ShopAuthGuard } from '../auth/shop-auth/auth-jwt.guard';
@Controller('inventory')
export class InventoryController {
    constructor(private readonly inventoryService: InventoryService) {};

    @Post('')
    @UseGuards(ShopAuthGuard, RoleGuard)
    @Roles(Role.Shop)
    addStockToInventory(@Body() payload: InventoryDTO){
        return this.inventoryService.addStockToInventory(payload)
    }
}
