import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
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
      const result = await this.crudService.getAll('board', options);
      return result;
    } catch (error) {
      throw error;
    }
  }

  @Get('recent-boards')
  async getRecentBoards(@GetUser() user: User): Promise<any> {
    try {
      const result = await this.crudService.getAll(
        'boardMember',
        {
          userId: user.id,
          sort: '-viewRecentlyDate',
          limit: 5,
        },
        {
          board: {
            include: { workspace: true }
          }
        },
      );

      return result;
    } catch (error) {
      throw error;
    }
  }

  @Get('joined-boards')
  async getAllJoinBoards(@GetUser() user: User): Promise<any> {
    try {
      const result = await this.crudService.getAll(
        'boardMember',
        {
          userId: user.id,
        },
        {
          board: {
            include: { workspace: true },
          },
        },
      );

      return result;
    } catch (error) {
      throw error;
    }
  }

  @Get('joined-boards/:workspaceId')
  @UseGuards(WorkspaceGuard)
  async getAllJoinBoardsInWorkspace(
    @GetUser() user: User,
    @Param('workspaceId', ParseIntPipe) workspaceId: number,
  ): Promise<any> {
    try {
      const result = await this.crudService.getAll(
        'boardMember',
        {
          userId: user.id,
          board: {
            workspaceId,
          },
        },
        {
          board: {
            include: { lists: true },
          },
        },
      );

      return result;
    } catch (error) {
      throw error;
    }
  }

  @Get(':id')
  @UseGuards(BoardGuard)
  async getBoard(@GetUser() user: User, @Param('id', ParseIntPipe) id: number): Promise<any> {
    try {
      const result = await this.crudService.getOne('board', id, {
        lists: {
          include: {
            cards: {
              include: {
                cardAttachments: true,
                cardAssignees: {
                  include: { assignee: true }
                },
                comments: true
              }
            }
          }
        },
        boardMembers: {
          include: {
            user: true,
          },
        },
      });
      const creatorIdx = result.board.boardMembers?.findIndex((member) => member.userId === result.board.creatorId);
      const [creator] = result.board.boardMembers.splice(creatorIdx, 1);
      result.board.creator = creator;
      const curIdx = result.board.boardMembers?.findIndex((member) => member.userId === user.id);
      if (curIdx !== -1 || result.board.creatorId === user.id) {
        await this.crudService.updateOne(
          'boardMember',
          {
            userId: user.id,
            boardId: id,
          },
          {
            viewRecentlyDate: new Date(),
          },
        );
        if (result.board.creatorId !== user.id) {
          const [cur] = result.board.boardMembers.splice(curIdx, 1);
          result.board.curMember = cur;
        } else result.board.curMember = creator;
      } else {
        result.board.curMember = null;
      }

      if (result.board.closed) {
        return {
          board: {
            id: result.board.id,
            name: result.board.name,
            creatorId: result.board.creatorId,
            background: result.board.background,
            closed: result.board.closed
          }
        }
      }
      return result;
    } catch (error) {
      throw error;
    }
  }

  @Post()
  @UseGuards(WorkspaceGuard)
  createBoard(@GetUser() user: User, @Body() body: CreateBoardDto): any {
    return this.boardService.createBoard(user.id, body);
  }

  @Patch(':id')
  @UseGuards(BoardGuard)
  async updateBoard(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateBoardDto): Promise<any> {
    try {
      const result = await this.crudService.updateOne('board', id, body, {
        lists: {
          include: {
            cards: true,
          },
        },
      });
      return result;
    } catch (error) {
      throw error;
    }
  }

  @Delete(':boardId/remove-board-member/:userId')
  @UseGuards(BoardGuard)
  async removeBoardMember(
    @Param('boardId', ParseIntPipe) boardId: number,
    @Param('userId', ParseIntPipe) userId: number
  ): Promise<any> {
    try {
      const result = await this.crudService.deleteOne('boardMember', { boardId, userId });
      return result;
    } catch (error) {
      throw error;
    }
  }

  @Delete(':id')
  @UseGuards(BoardGuard)
  async deleteBoard(@Param('id', ParseIntPipe) id: number): Promise<any> {
    try {
      const result = await this.crudService.deleteOne('board', id);
      return result;
    } catch (error) {
      throw error;
    }
  }

  @Post('join-board/:id')
  @UseGuards(BoardGuard)
  async joinBoard(@GetUser() user: User, @Param('id', ParseIntPipe) boardId: number): Promise<any> {
    try {
      await this.crudService.createOne('boardMember', {
        userId: user.id,
        boardId,
      });
      const result = await this.crudService.getOne('board', boardId, {
        lists: {
          include: {
            cards: true,
          },
        },
        boardMembers: true,
      });
      return result;
    } catch (error) {
      throw error;
    }
  }

  @Post('share-board')
  @UseGuards(BoardGuard)
  shareBoard(@GetUser() user: User, @Body() body: ShareBoardDto): any {
    return this.boardService.shareBoard(body);
  }

  @Delete('leave-board/:id')
  @UseGuards(BoardGuard)
  async leaveBoard(@GetUser() user: User, @Param('id', ParseIntPipe) boardId: number): Promise<any> {
    try {
      const result = await this.crudService.deleteOne('boardMember', {
        userId: user.id,
        boardId,
      });

      return result;
    } catch (error) {
      throw error;
    }
  }

  @Patch('starred-board/:boardId')
  @UseGuards(BoardGuard)
  async starredBoard(
    @GetUser() user: User,
    @Param('boardId', ParseIntPipe) boardId: number,
    @Body('starred') starred: boolean,
  ): Promise<any> {
    try {
      const result = await this.crudService.updateOne(
        'boardMember',
        { userId: user.id, boardId },
        {
          starred,
        },
      );
      return result;
    } catch (error) {
      throw error;
    }
  }

  @Get('accept-invitation-link/:token')
  acceptInvitationLink(@GetUser() user: User, @Param('token') token: string): any {
    return this.boardService.acceptInvitationLink(user.id, token);
  }

  @Get(":id/members")
  @UseGuards(BoardGuard)
  getWorkspaceMembers(@Param('id', ParseIntPipe) id: number, @Query('search') search: string): any {
    return this.boardService.getBoardMembers(id, search ? search : '');
  }
}
