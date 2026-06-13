import { ConflictException } from '@nestjs/common';

export class KeyDuplicationException extends ConflictException {
  constructor(keyName: string, entityName: string) {
    const message = `Key ${entityName} in model [${keyName}] is duplicated`;
    super(message);
    super.name = KeyDuplicationException.name;
    super.message = message;
  }
}
