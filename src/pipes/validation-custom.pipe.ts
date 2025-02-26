import { HttpStatus, UnprocessableEntityException, ValidationPipe } from '@nestjs/common';
import { ValidationError } from 'class-validator';

export class ValidationCustomPipe {
    static compactVersion() {
        return new ValidationPipe({ whitelist: true, errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY });
    }

    static extendVersion() {
        return new ValidationPipe({
            whitelist: true,
            errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
            exceptionFactory: (validationErrors: ValidationError[] = []) => {
                type MyError = { field: string; errors: string[] | MyError[] };
                function parseError(error: ValidationError, parentName = ''): MyError {
                    const fieldName = parentName ? [parentName, error.property].join('.') : error.property;
                    if (error.children!.length === 0) return { 
                        field: fieldName, errors: error.constraints ? Object.values(error.constraints) : []
                    };
                    return {
                        field: fieldName,
                        errors: error.children!.map((e) => parseError(e, fieldName)),
                    };
                }
                return new UnprocessableEntityException(validationErrors.map((e) => parseError(e)));
            },
        });
    }
}
