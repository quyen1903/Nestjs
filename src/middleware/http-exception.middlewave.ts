import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';
import { NODE_ENV } from 'src/app.config';
@Catch(HttpException)
export class HttpExceptionMiddleware implements ExceptionFilter {
    private readonly logger = new Logger(HttpExceptionMiddleware.name);

    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();
        const message = this.getErrorMessage(exception.getStatus(), exception.getResponse());
        const name: string = exception.name || 'HttpException';
        const statusCode = exception.getStatus();

        if (
        [
            HttpStatus.UNPROCESSABLE_ENTITY,
            HttpStatus.BAD_REQUEST,
            HttpStatus.CONFLICT,
            HttpStatus.UNAUTHORIZED,
            HttpStatus.FORBIDDEN,
        ].includes(statusCode)
        ) {
        // Log nothing
        } else this.logger.error(message, exception.stack);

        response.status(exception.getStatus()).json({
            name,
            message,
            statusCode,
            data: (exception as any).response,
            path: request.url,
            timestamp: new Date().toISOString(),
            error: (exception as any).error,
            stack: NODE_ENV === 'production' ? '🧌' : exception.stack,
        });
    }

    private getErrorMessage(httpStatus: number, errorResponse: string | object): string | Record<string, any> {
        if (httpStatus === HttpStatus.UNPROCESSABLE_ENTITY && typeof errorResponse === 'object' && 'message' in errorResponse) {
            return errorResponse as { message: string }; // Explicit type assertion
        } else if (typeof errorResponse === 'string') {
            return errorResponse;
        } else if (typeof errorResponse === 'object' && 'message' in errorResponse) {
            return (errorResponse as { message: string }).message;
        } else {
            return 'Server Error';
        }
    }
  
}
