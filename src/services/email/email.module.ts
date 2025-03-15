import { Module } from '@nestjs/common';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';
import { MailerModule } from '@nestjs-modules/mailer';
import { MAIL_HOST, MAIL_FROM, MAIL_USER, MAIL_PASSWORD } from 'src/app.config';

@Module({
    imports:[
        MailerModule.forRoot({
            transport:{
                host: MAIL_HOST,
                port:587,
                secure:false,
                auth:{
                    user:MAIL_USER,
                    pass:MAIL_PASSWORD
                },
            },
            defaults:{
                from: MAIL_FROM
            },
            template:{
                dir: process.cwd()+'/src/services/email/templates',
                adapter: new HandlebarsAdapter(),
                options: {
                  strict: true,
                },
            }
        })
    ],
    controllers: [EmailController],
    providers: [EmailService],
    exports: [EmailService]
})
export class EmailModule {}
