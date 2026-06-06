import { Controller } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { SpuService } from './spu.service';

@Controller('spu')
@ApiExcludeController()
export class SpuController {
  constructor(private readonly spuService: SpuService) {}
}
