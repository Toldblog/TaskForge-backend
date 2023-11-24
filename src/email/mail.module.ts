import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { join } from 'path';
import { MailController } from './mail.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
    imports: [
        MailerModule.forRootAsync({
            useFactory: async () => ({
                transport: {
                    host: process.env.EMAIL_HOST,
                    auth: {
                        user: process.env.EMAIL_USERNAME,
                        pass: process.env.EMAIL_PASSWORD
                    },
                },
                defaults: {
                    from: `"No Reply" <${process.env.EMAIL_FROM}>`,
                },
                template: {
                    dir: join(__dirname, '../../views'),
                    adapter: new HandlebarsAdapter(),
                    options: {
                        strict: true
                    },
                },
            })
        }),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get('JWT_SECRET'),
                signOptions: {
                    expiresIn: configService.get('VERIFICATION_TOKEN_EXPIRATION_TIME'),
                },
            })
        })
    ],
    providers: [MailService, ConfigService],
    exports: [MailService],
    controllers: [MailController],
})
export class MailModule { }
