import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { join } from 'path';
import { readFileSync, existsSync } from 'fs';

@Controller()
export class AppController {
  @Get('/')
  getHomePage(@Res() res: Response) {
    const htmlPath = join(process.cwd(), 'public', 'index.html');

    if (!existsSync(htmlPath)) {
      return res.status(404).send('<h1>404 - File Not Found</h1>');
    }

    const htmlContent = readFileSync(htmlPath, 'utf8');
    res.setHeader('Content-Type', 'text/html');
    res.send(htmlContent);
  }
}
