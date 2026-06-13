import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { DiscordService } from "src/services/discord/discord.service";
@Injectable()
export class DiscordMiddleware implements NestMiddleware{
    
    constructor(
        private readonly discordService: DiscordService
    ){}
    use(req: Request, res: Response, next: NextFunction){
        console.log("🌐 Middleware Triggered for:", req.method, req.originalUrl);
        this.discordService.sendToFormatCode({
            title:`Method: ${req.method}`,
            code: req.method === 'GET' ? req.query: req.body,
            message: `${req.get('host')}${req.originalUrl}}`
        })
        next()
    }
}