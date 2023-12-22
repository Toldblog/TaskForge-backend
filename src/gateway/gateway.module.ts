import { Module } from '@nestjs/common';
import { AppGateway } from './app.gateway';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MessagesService } from 'src/messages/messages.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get<string>('ACCESS_TOKEN_EXPIRATION_TIME'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AppGateway, MessagesService],
})
export class GatewayModule {}
