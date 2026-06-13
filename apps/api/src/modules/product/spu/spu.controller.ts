import { Controller } from '@nestjs/common';
import { SpuService } from './spu.service';

@Controller('spu')
export class SpuController {
  constructor(private readonly spuService: SpuService) {}
}
