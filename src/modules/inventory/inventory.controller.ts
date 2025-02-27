import { Controller, UseGuards, Body, Post } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { AuthGuard } from '../auth/auth-jwt.guard';
import { InventoryDTO } from './dto/inventory.dto';
@UseGuards(ApiKeyGuard)
@Controller('inventory')
export class InventoryController {
    constructor(private readonly inventoryService: InventoryService) {};

    @Post('')
    @UseGuards(AuthGuard)
    addStockToInventory(@Body() payload: InventoryDTO){
        return this.inventoryService.addStockToInventory(payload)
    }
}
