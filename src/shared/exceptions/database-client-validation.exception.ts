import { UnprocessableEntityException } from '@nestjs/common';

export class DatabaseClientValidationException extends UnprocessableEntityException {
  constructor(message: string) {
    super(message);
    super.name = DatabaseClientValidationException.name;
    super.message = message;
  }
}
