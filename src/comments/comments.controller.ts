import {
    Controller,
    UseInterceptors,
    UseGuards,
    Post,
    Param,
    ParseIntPipe,
    Body
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards';
import { RolesGuard } from 'src/common/guards';
import { ResponseInterceptor } from 'src/common/interceptors';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { User } from '@prisma/client';
import { CommentsService } from './comments.service';
import { CommentDto } from './dtos';

@Controller('comments')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(ResponseInterceptor)
export class CommentsController {
    constructor(private commentsService: CommentsService) { }

    @Post(':cardId')
    commentOnCard(
        @GetUser() user: User,
        @Param('cardId', ParseIntPipe) cardId: number,
        @Body() comment: CommentDto
    ): any {
        return this.commentsService.commentOnCard(user.id, user.name, cardId, comment.content);
    }
}
