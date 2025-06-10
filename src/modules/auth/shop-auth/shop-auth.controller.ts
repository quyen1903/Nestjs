import { Controller } from '@nestjs/common';
import { ShopAuthService } from './shop-auth.service';

@Controller('shop-auth')
export class ShopAuthController {
  constructor(private readonly shopAuthService: ShopAuthService) {
    
  }
}
