import { Injectable, NestMiddleware } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";
import type { Request, Response, NextFunction } from "express";

@Injectable()
export class RequestIdMiddleware implements NestMiddleware{
    use(req: Request, res: Response, next: NextFunction) {
        (req as any).requestId = uuidv4(); // assign uuidv4 to request
        res.setHeader('x-request-id', (req as any).requestId); // assign x-request-id to response header
        next();
    }
}
