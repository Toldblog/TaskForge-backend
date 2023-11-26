import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy, GoogleStrategy } from './strategies/index';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailModule } from 'src/email/mail.module';
@Module({
  imports: [
    MailModule,
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('ACCESS_TOKEN_EXPIRATION_TIME'),
        },
      }),
    })
  ],
  providers: [AuthService, JwtStrategy, GoogleStrategy],
  controllers: [AuthController],
  exports: [JwtStrategy, GoogleStrategy, PassportModule]
})
export class AuthModule { }
