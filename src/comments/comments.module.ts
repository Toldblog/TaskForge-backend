import { Module } from '@nestjs/common';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
// import { GatewayModule } from 'src/gateway/gateway.module';
import { JwtModule } from '@nestjs/jwt';
// import { AppGateway } from 'src/gateway/app.gateway';

@Module({
  imports: [JwtModule],
  controllers: [CommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}
