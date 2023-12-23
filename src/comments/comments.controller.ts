import {
    Controller,
    UseInterceptors,
    UseGuards,
    Post,
    Param,
    ParseIntPipe,
    Body,
    Get,
    Patch,
    Delete
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards';
import { ResponseInterceptor } from 'src/common/interceptors';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { User } from '@prisma/client';
import { CommentsService } from './comments.service';
import { CommentDto } from './dtos';
import { CardGuard } from 'src/common/guards';
import { CRUDService } from 'src/common/providers';
import { UtilService } from 'src/common/providers';

@Controller('comments')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ResponseInterceptor)
export class CommentsController {
    constructor(
        private readonly commentsService: CommentsService,
        private readonly crudService: CRUDService,
        private readonly utilService: UtilService
    ) { }

    @Get(':cardId')
    @UseGuards(CardGuard)
    async getCommentsByCard(@Param('cardId', ParseIntPipe) cardId: number): Promise<any> {
        try {
            let result = await this.crudService.getAll('comment', {
                cardId
            }, { commenter: true });

            result = result['comments'].map(comment => ({
                ...comment,
                commenter: this.utilService.filterUserResponse(comment.commenter)
            }));
            return result;
        } catch (error) {
            throw error;
        }
    }

    @Post(':cardId')
    commentOnCard(
        @GetUser() user: User,
        @Param('cardId', ParseIntPipe) cardId: number,
        @Body() comment: CommentDto
    ): any {
        return this.commentsService.commentOnCard(user.id, cardId, comment.content);
    }

    @Delete(':id')
    deleteComment(@GetUser() user: User, @Param('id', ParseIntPipe) id: number): any {
        return this.commentsService.deleteComment(user.id, id);
    }

    @Patch(':id')
    editComment(
        @GetUser() user: User,
        @Param('id', ParseIntPipe) id: number,
        @Body() body: { content: string }
    ): any {
        return this.commentsService.editComment(user.id, id, body.content);
    }
}
