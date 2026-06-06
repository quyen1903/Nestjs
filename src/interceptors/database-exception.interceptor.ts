import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { EntityNotFoundException } from '../shared/exceptions/entity-not-found.exception';
import { KeyDuplicationException } from '../shared/exceptions/key-duplication.exception';
import { DatabaseClientValidationException } from '../shared/exceptions/database-client-validation.exception';
import { WriteRelationNotFoundException } from '../shared/exceptions/write-relation-not-found.exception';

type PgError = Error & {
  code?: string;
  table?: string;
  column?: string;
  constraint?: string;
  detail?: string;
};

@Injectable()
export class DatabaseExceptionInterceptor implements NestInterceptor {
  private readonly logger = new Logger(DatabaseExceptionInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error: PgError) => {
        this.logger.debug('DatabaseExceptionInterceptor:', error);

        if (error?.code === '23505') {
          throw new KeyDuplicationException(error.table ?? 'entity', error.constraint ?? error.detail ?? 'unique');
        }

        if (error?.code === '23503') {
          throw new WriteRelationNotFoundException(null, error.table ?? 'entity', error.detail);
        }

        if (error?.code === '23502' || error?.code === '22P02') {
          throw new DatabaseClientValidationException(error.detail ?? error.message);
        }

        if (error?.code === 'P2025') {
          throw new EntityNotFoundException(undefined, error.message);
        }

        throw error;
      }),
    );
  }
}
