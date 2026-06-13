import { UnprocessableEntityException } from '@nestjs/common';

export class PrismaClientValidationException extends UnprocessableEntityException {
  constructor(message: string) {
    message = message;
    super(message);
    super.name = PrismaClientValidationException.name;
    super.message = message;
  }
}
