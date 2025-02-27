import { Controller, UseGuards, Body, Post } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { AuthGuard } from '../auth/auth-jwt.guard';

@UseGuards(ApiKeyGuard)
@Controller('inventory')
export class InventoryController {
    constructor(private readonly inventoryService: InventoryService) {};

    @Post('')
    @UseGuards(AuthGuard)
    addStockToInventory(@Body() payload){
        return this.inventoryService.addStockToInventory(payload)
    }
}
