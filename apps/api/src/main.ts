import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import bodyParser from 'body-parser';
import compression from 'compression';
import cluster from 'node:cluster';
import os from 'node:os';
import { PrismaExceptionInterceptor } from './interceptors/prisma-exception.interceptor';
import { SuccessInterceptor } from './interceptors/response.interceptor';
import { ValidationCustomPipe } from './pipes/validation-custom.pipe';
import { HttpExceptionFilter } from './exception-filter/http.exception-filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

(BigInt.prototype as any).toJSON = function () {
    return this.toString();
};
  

async function bootstrap() {
    const port = process.env.PORT ?? 3056;
    const apiPrefix = 'v1/api';

    /*
        only primary process ( old Nodejs version is isMaster ) can use systemcall fork to create new nodejs process
        the reason for this, if we not, 

    */
    if (cluster.isPrimary) {
        console.log(`Primary ${process.pid} is running`);

        
        // Get the number of available CPU cores
        let cpuCores = os.availableParallelism();
        const haflCpu = cpuCores/2
        
        // Fork workers
        for (let i = 0; i < 1; i++) {
            cluster.fork();
        }

        // Handle worker crashes and exits
        cluster.on('exit', (worker, code, signal) => {
            console.log(`Worker ${worker.process.pid} died with code: ${code} and signal: ${signal}`);
            console.log('Starting a new worker...');
            cluster.fork();
        });

        // Log when a worker comes online
        cluster.on('online', (worker) => {
            console.log(`Worker ${worker.process.pid} is online`);
        });

        // Handle uncaught errors in the primary process
        process.on('uncaughtException', (err) => {
            console.error('Uncaught Exception:', err);
        });

        process.on('unhandledRejection', (reason, promise) => {
            console.error('Unhandled Rejection at:', promise, 'reason:', reason);
        });
    } else {
        try {
            // Create NestJS application instance
            const app = await NestFactory.create(AppModule);
            
            // Configure CORS
            app.enableCors({
                origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
                methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
                credentials: true,
            });
            
            // Security middleware
            app.use(helmet());
            
            // Compression middleware
            app.use(compression());
            
            // Stripe webhook signature verification requires the unparsed body.
            app.use(`/${apiPrefix}/payments/webhook`, bodyParser.raw({
                type: 'application/json',
                limit: '2mb',
            }));

            // Body parser configuration
            app.use(bodyParser.json({ limit: '50mb' }));
            app.use(bodyParser.urlencoded({
                limit: '50mb',
                extended: true,
                parameterLimit: 50000,
            }));
            // app.useGlobalInterceptors(new PrismaExceptionInterceptor());


            // Global prefix for all routes
            app.setGlobalPrefix(apiPrefix);
            app.useGlobalInterceptors(new PrismaExceptionInterceptor());
            app.useGlobalInterceptors(new SuccessInterceptor())
            app.useGlobalPipes(ValidationCustomPipe.compactVersion());
            app.useGlobalFilters(new HttpExceptionFilter());
            const config = new DocumentBuilder()
                .setTitle('E-Commerce API')
                .setDescription('The API documentation')
                .setVersion('1.0')
                .addBearerAuth({
                    type:'http',
                    scheme:'bearer',
                    bearerFormat:'JWT'
                },'access')
                .build();

            const document = SwaggerModule.createDocument(app, config);
            SwaggerModule.setup('api-docs', app, document);
            // Start listening
            await app.listen(port);
            console.log(`Worker ${process.pid} started on port ${port}`);
        } catch (error) {
            console.error('Error starting worker process:', error);
            process.exit(1);
        }
    }
}

// Handle errors during bootstrap
bootstrap().catch((error) => {
    console.error('Error during bootstrap:', error);
    process.exit(1);
});
