// import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
// import { Request } from 'express';
// import { ApiKeyService } from '../keytoken/api-key.service';
// import { ApiService } from '../api/api.service';
// @Injectable()
// export class ApiKeyGuard implements CanActivate {
//     constructor(private readonly apiService: ApiService) {}

//     async canActivate(context: ExecutionContext): Promise<boolean> {
//         const request = context.switchToHttp().getRequest<Request>();
//         const apiKey = request.headers['x-api-key'] as string;
//         console.log('Received API Key:', apiKey);

//         if (!apiKey) {
//             throw new ForbiddenException('Forbidden: API Key is missing');
//         }

//         const objKey = await this.apiService.findById(apiKey);
//             if (!objKey) {
//             throw new ForbiddenException('Forbidden: Invalid API Key');
//         }

//         request['apiKey'] = objKey;
//         return true;
//     }
// }
