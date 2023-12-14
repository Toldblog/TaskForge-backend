import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { BoardsService } from './boards.service';
import { JwtAuthGuard } from 'src/auth/guards';
import { ResponseInterceptor } from 'src/common/interceptors';
import { CRUDService } from 'src/common/providers';
import { BoardGuard, Roles, RolesGuard, Role, WorkspaceGuard } from 'src/common/guards';
import { CreateBoardDto, UpdateBoardDto, ShareBoardDto } from './dtos';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { User } from '@prisma/client';

@Controller('boards')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(ResponseInterceptor)
export class BoardsController {
    constructor(
        private boardService: BoardsService,
        private crudService: CRUDService,
    ) { }

    @Get()
    @Roles(Role.ADMIN)
    async getAllBoards(@Query() options: any): Promise<any> {
        try {
            const result = await this.crudService.getAll('Board', options);
            return result;
        } catch (error) {
            throw error;
        }
    }

    @Get(':id')
    @UseGuards(BoardGuard)
    getBoard(@Param('id', ParseIntPipe) id: number): any {
        return this.boardService.getBoard(id);
    }

    @Post()
    @UseGuards(WorkspaceGuard)
    createBoard(@GetUser() user: User, @Body() body: CreateBoardDto): any {
        return this.boardService.createBoard(user.id, body);
    }

    @Patch(':id')
    @UseGuards(BoardGuard)
    async updateBoard(@Param('id') id: string, @Body() body: UpdateBoardDto): Promise<any> {
        try {
            const result = await this.crudService.updateOne('Board', id, body);
            return result;
        } catch (error) {
            throw error;
        }
    }

    @Delete(":id")
    @UseGuards(BoardGuard)
    async deleteBoard(@Param('id') id: string): Promise<any> {
        try {
            const result = await this.crudService.deleteOne('Board', id);
            return result;
        } catch (error) {
            throw error;
        }
    }

    @Post("join-board/:id")
    @UseGuards(BoardGuard)
    joinBoard(@GetUser() user: User, @Param('id', ParseIntPipe) boardId: number): any {
        return this.boardService.joinBoard(user.id, boardId);
    }

    @Post("share-board")
    @UseGuards(BoardGuard)
    shareBoard(@GetUser() user: User, @Body() body: ShareBoardDto): any {
        return this.boardService.shareBoard(user.id, user.name, body);
    }

    @Delete("leave-board/:id")
    @UseGuards(BoardGuard)
    leaveBoard(@GetUser() user: User, @Param('id', ParseIntPipe) boardId: number): any {
        return this.boardService.leaveBoard(user.id, boardId);
    }

    @Patch("starred-board/:id")
    @UseGuards(BoardGuard)
    starredBoard(@GetUser() user: User, @Param('id', ParseIntPipe) boardId: number): any {
        return this.boardService.starredBoard(user.id, boardId);
    }

    @Get("invite/:token")
    joinBoardByLink(@GetUser() user: User, @Param('token') token: string): any {
        return this.boardService.joinBoardByLink(user.id, token);
    }
}
