import {
  Controller,
  UseInterceptors,
  UseGuards,
  Post,
  Param,
  ParseIntPipe,
  Body,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards';
import { RolesGuard } from 'src/common/guards';
import { ResponseInterceptor } from 'src/common/interceptors';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { User } from '@prisma/client';
import { MessagesService } from './messages.service';
import { CommentDto } from './dtos';

@Controller('messages')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(ResponseInterceptor)
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  @Post(':boardId')
  commentOnCard(
    @GetUser() user: User,
    @Param('boardId', ParseIntPipe) boardId: number,
    @Body() comment: CommentDto,
  ): any {
    return this.messagesService.sendMessage(
      user.id,
      user.name,
      boardId,
      comment.content,
    );
  }
}
