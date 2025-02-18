import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import * as bodyParser from 'body-parser';
import * as compression from 'compression';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const port = process.env.PORT ?? 3056;  // Lấy port từ biến môi trường hoặc mặc định là 3056

    app.enableCors(); 
    app.use(helmet());
    app.use(compression());
    app.use(bodyParser.json({ limit: '50mb' }));
    app.use(
        bodyParser.urlencoded({
        limit: '50mb',
        extended: true,
        parameterLimit: 50000,
        }),
    );
    app.setGlobalPrefix('v1/api')

    await app.listen(port);
    console.log('app running at port:',port)
}
bootstrap();
