import { ISendMailOptions, MailerService } from "@nestjs-modules/mailer";
import { Injectable } from "@nestjs/common";

@Injectable()
export class EmailService{
    constructor(
        private readonly mailerService: MailerService
    ){}

    async sendEmail(options: ISendMailOptions){
        await this.mailerService.sendMail(options)
    }

    /**
     * create table  contain otp
     * i
    */
    async sendPasswordResetEmail(email: string, token: string){
        const result = await this.mailerService.sendMail({
            to: email,
            subject: 'Reset Your Password',
            template: './reset-password',
            context: {
                email,
                token
            },
        });
        return result;
      
    }
}