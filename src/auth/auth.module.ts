import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy, GoogleStrategy } from './strategies/index';
import { MailModule } from 'src/email/mail.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CardsService } from 'src/cards/cards.service';
@Module({
  imports: [
    MailModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get<string>('ACCESS_TOKEN_EXPIRATION_TIME') },
      }),
      inject: [ConfigService],
    })
  ],
  providers: [AuthService, JwtStrategy, GoogleStrategy, CardsService],
  exports: [JwtModule],
  controllers: [AuthController],
})
export class AuthModule { }
