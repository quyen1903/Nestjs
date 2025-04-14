import { Controller } from '@nestjs/common';
import { MurlockService } from './murlock.service';

@Controller('murlock')
export class MurlockController {
  constructor(private readonly murlockService: MurlockService) {}
}
