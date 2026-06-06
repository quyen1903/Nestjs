import { Controller } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { EmailService } from './email.service';

@Controller('email')
@ApiExcludeController()
export class EmailController {
  constructor(private readonly emailService: EmailService) {}
}
