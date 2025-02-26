import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { PrismaClientKnownRequestError, PrismaClientValidationError } from '@prisma/client/runtime/library';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { EntityNotFoundException } from '../shared/exceptions/entity-not-found.exception';
import { KeyDuplicationException } from '../shared/exceptions/key-duplication.exception';
import { PrismaClientValidationException } from '../shared/exceptions/prisma-client-validation.exception';
import { WriteRelationNotFoundException } from '../shared/exceptions/write-relation-not-found.exception';

@Injectable()
export class PrismaExceptionInterceptor implements NestInterceptor {
  private readonly logger = new Logger(PrismaExceptionInterceptor.toString());
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        this.logger.debug('PrismaExceptionInterceptor:', error);
        if (error instanceof PrismaClientValidationError) throw new PrismaClientValidationException(error.name);
        else if (error instanceof PrismaClientKnownRequestError) {
          console.log(error);
          if (error.code === 'P2002')
            throw new KeyDuplicationException(error.meta!.modelName as string, `${error.meta!.target}` as string);
          else if (
            error.code === 'P2025' &&
            ['record to update', 'relation'].some(
              (p) => error.meta?.cause && p.toLowerCase().indexOf((error.meta.cause as string).toLowerCase()),
            ) &&
            error.meta?.modelName
          )
            throw new WriteRelationNotFoundException(null, error.meta.modelName as string, error.meta.cause as string);
          else if (error.code === 'P2025') throw new EntityNotFoundException(undefined, error.message);
          else if (error.code === 'P2017' && error.meta!.relation_name)
            throw new WriteRelationNotFoundException(
              undefined,
              error.meta!.modelName as string,
              `No relation between ${error.meta!.parent_name} & ${error.meta!.child_name}`,
            );
        }
        throw error;
      }),
    );
  }
}
