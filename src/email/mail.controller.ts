
import {
    Controller,
    Param,
    Get,
    Render
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
}