import { applyDecorators } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiBody,
    ApiBodyOptions,
    ApiOperation,
    ApiParam,
    ApiParamOptions,
    ApiQuery,
    ApiQueryOptions,
    ApiResponse,
    ApiResponseOptions,
} from '@nestjs/swagger';

type ApiEndpointOptions = {
    summary: string;
    description?: string;
    auth?: boolean;
    body?: ApiBodyOptions;
    params?: ApiParamOptions[];
    queries?: ApiQueryOptions[];
    responses?: ApiResponseOptions[];
};

export function ApiEndpoint(options: ApiEndpointOptions) {
    const decorators = [
        ApiOperation({
            summary: options.summary,
            description: options.description,
        }),
        ...(options.responses?.length
            ? options.responses.map((response) => ApiResponse(response))
            : [ApiResponse({ status: 200, description: 'Success' })]),
    ];

    if (options.auth) {
        decorators.push(ApiBearerAuth('access'));
    }

    if (options.body) {
        decorators.push(ApiBody(options.body));
    }

    options.params?.forEach((param) => decorators.push(ApiParam(param)));
    options.queries?.forEach((query) => decorators.push(ApiQuery(query)));

    return applyDecorators(...decorators);
}
