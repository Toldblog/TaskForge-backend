
import {
    Controller,
    Param,
    Get,
    Render,
    Query,
} from '@nestjs/common';
import { MailService } from './mail.service';

@Controller('mail')
export class MailController {
    constructor(
        private readonly mailService: MailService
    ) { }

    @Get('verify/:token')
    @Render('email-verification-response')
    async verify(@Param('token') token: string): Promise<any> {
        const { message, url } = await this.mailService.verifyEmail(token);

        return { message, url };
    }

    @Get('resend-email-verification')
    @Render('email-verification-response')
    async resendVerificationLink(@Query('email') email: string): Promise<any> {
        const message = await this.mailService.resendEmailVerification(email);

        return { message };
    }
}