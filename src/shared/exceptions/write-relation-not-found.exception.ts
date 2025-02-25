import { ConflictException } from '@nestjs/common';
import { capitalize, startCase, toLower } from 'lodash';

export class WriteRelationNotFoundException extends ConflictException {
  constructor(action?: null|'create' | 'update' | 'delete', conflictEntityName: string = 'entity', realCause?: string) {
    const entityName = startCase(toLower(conflictEntityName));
    let message = action ? `${capitalize(action)} action` : 'Action';
    message += ` can't execute due to not found ${entityName} or related to ${entityName}.`;
    message += realCause ? ` Detail: ${realCause}` : '';
    super(message);
    super.name = WriteRelationNotFoundException.name;
    super.message = message;
  }
}
