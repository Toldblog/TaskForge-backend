import { Module } from '@nestjs/common';
import { GatewayModule } from 'src/gateway/gateway.module';
import { JwtModule } from '@nestjs/jwt';
import { AppGateway } from 'src/gateway/app.gateway';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';

@Module({
  imports: [GatewayModule, JwtModule],
  controllers: [MessagesController],
  providers: [MessagesService, AppGateway],
})
export class MessagesModule {}
