import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { DiscordService } from 'src/services/discord/discord.service';

@Injectable()
export class DiscordMiddleware implements NestMiddleware {
    constructor(private readonly discordService: DiscordService) {}

    use(req: Request, res: Response, next: NextFunction) {
        const requestId = (req as Request & { requestId?: string }).requestId;
        this.discordService.sendToFormatCode({
            title: `Method: ${req.method}`,
            code: JSON.stringify({
                method: req.method,
                path: req.path,
                requestId,
            }),
            message: req.path,
        });
        next();
    }
}
