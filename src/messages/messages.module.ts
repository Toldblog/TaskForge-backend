import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';

@Module({
  imports: [JwtModule],
  controllers: [MessagesController],
  exports: [MessagesService],
  providers: [MessagesService],
})
export class MessagesModule {}
