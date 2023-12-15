import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Workspace } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class MailService {
    constructor(
        private readonly mailerService: MailerService,
        private readonly prismaService: PrismaService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService
    ) { }

    async sendEmailVerification(user: any): Promise<void> {
        const emailToken = await this.createEmailToken(user.email);
        const url = `${this.configService.get('BASE_URL')}/api/mail/verify/${emailToken}`;

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

    async sendEmailResetPassword(email: string, resetToken: string): Promise<void> {
        const url = `${this.configService.get('BASE_URL')}/api/auth/reset-password/${resetToken}`;

        await this.mailerService.sendMail({
            to: email,
            // from: process.env.MAIL_FROM,
            subject: 'TaskForge: Reset password',
            template: './reset-password.hbs', // `.hbs` extension is appended automatically
            context: {
                url
            },
        });
    }

    async verifyEmail(token: string): Promise<any> {
        const { email, expired } = await this.decodeConfirmationToken(token);
        // Get user by email
        const user = await this.prismaService.user.findFirst({
            where: { email }
        });

        // check if user is active
        if (user.active) {
            return {
                message: 'Email already verified.',
            };
        }

        // token is expired -> resend email verification
        if (expired)
            return {
                message: 'Email verification token expired.',
                url: `${this.configService.get('BASE_URL')}/api/mail/resend-email-verification?email=${email}`
            };


        // let the user be active
        await this.prismaService.user.update({
            where: { email },
            data: { active: true }
        });

        return {
            message: "Email verified successfully. Now, you can login to TaskForge",
        };
    }

    async resendEmailVerification(email: string): Promise<any> {
        const user = await this.prismaService.user.findFirst({
            where: { email }
        });

        if (user.active) {
            return "Email already verified.";
        }

        // resend email verification
        await this.sendEmailVerification(user);

        return "Email verification already sent again."
    }

    async decodeConfirmationToken(token: string) {
        try {
            const payload = await this.jwtService.verify(token, { ignoreExpiration: true });

            if (typeof payload === 'object' && 'email' in payload) {
                if ('exp' in payload && parseFloat(Date.now().toString()) / 1000 < payload.exp) {
                    return {
                        email: payload.email,
                        expired: false
                    };
                } else {
                    return {
                        email: payload.email,
                        expired: true
                    };
                }
            }
        } catch (error) {
            throw new BadRequestException('Bad verification token');
        }
    }

    async createEmailToken(email: string): Promise<string> {
        const emailToken = this.jwtService.signAsync({ email });

        return emailToken;
    }

    async sendWorkspaceInvitation(email: string, senderName: string, workspace: Workspace): Promise<void> {
        const url = `https://frontend-domain.com/workspace/${workspace.id}`;

        await this.mailerService.sendMail({
            to: email,
            // from: process.env.MAIL_FROM,
            subject: 'Invite to workspace',
            template: './workspace-invitation.hbs', // `.hbs` extension is appended automatically
            context: {
                senderName,
                workspaceName: workspace.name,
                url,
            },
        });
    }
}