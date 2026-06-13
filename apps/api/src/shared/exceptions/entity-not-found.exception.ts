import { NotFoundException } from '@nestjs/common';
import { capitalize } from 'lodash';

export class EntityNotFoundException extends NotFoundException {
  constructor(entityName?: string, errorMsg?: string) {
    let message = entityName ? `${capitalize(entityName)} not found.` : 'Entity not found';
    if (errorMsg) message = errorMsg;
    super(message);
    super.name = EntityNotFoundException.name;
    super.message = message;
  }
}
