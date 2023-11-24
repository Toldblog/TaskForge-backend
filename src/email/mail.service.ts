import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class MailService {
    constructor(
        private readonly mailerService: MailerService,
        private readonly prismaService: PrismaService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService
    ) { }

    async sendUserConfirmation(user: any): Promise<void> {
        const emailToken = await this.createEmailToken(user.email);
        const url = `${this.configService.get('BASE_URL')}/mail/verify/${emailToken}`;

        await this.mailerService.sendMail({
            to: user.email,
            // from: process.env.MAIL_FROM,
            subject: 'Welcome to TaskForge! Confirm your Email',
            template: './email-verification.hbs', // `.hbs` extension is appended automatically
            context: {
                name: user.name,
                email: user.email,
                url,
            },
        });
    }

    async verifyEmail(token: string): Promise<any> {
        const { email, expired } = await this.decodeConfirmationToken(token);
        if (expired)
            return {
                message: 'Email verification token expired.',
                url: 'https://www.facebook.com/'
            };

        // Get user by email
        const user = await this.prismaService.user.findUnique({
            where: { email }
        });

        if (user.active) {
            return {
                message: 'Email verification token expired.',
            };
        }

        // let the user be active
        await this.prismaService.user.update({
            where: { email },
            data: { active: true }
        });

        return {
            message: "Email verified successfully. Now, you can login to TaskForge",
        };
    }

    async decodeConfirmationToken(token: string) {
        try {
            const payload = await this.jwtService.verify(token);

            if (typeof payload === 'object' && 'email' in payload) {
                return {
                    email: payload.email,
                    expired: false
                };
            }
        } catch (error) {
            if (error?.name === 'TokenExpiredError') {
                return {
                    email: '',
                    expired: true
                };
            }
            throw new BadRequestException('Bad verification token');
        }
    }

    async createEmailToken(email: string): Promise<string> {
        const emailToken = this.jwtService.signAsync({ email });

        return emailToken;
    }
}