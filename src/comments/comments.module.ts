import { Module } from '@nestjs/common';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { GatewayModule } from 'src/gateway/gateway.module';
import { JwtModule } from '@nestjs/jwt';
import { AppGateway } from 'src/gateway/app.gateway';

@Module({
  imports: [GatewayModule, JwtModule],
  controllers: [CommentsController],
  providers: [CommentsService, AppGateway]
})
export class CommentsModule { }
