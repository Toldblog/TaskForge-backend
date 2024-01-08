import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UtilService } from 'src/common/providers';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBoardDto, ShareBoardDto } from './dtos';
import * as crypto from 'crypto';

@Injectable()
export class BoardsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly utilService: UtilService,
  ) { }

  async getBoardByToken(token: string): Promise<any> {
    try {
      const board = await this.prismaService.board.findFirst({
        where: {
          inviteToken: token
        }
      });
      if (!board) {
        throw new NotFoundException("Board not found");
      }

      return {
        workspace: {
          id: board.id,
          name: board.name
        }
      }
    } catch (error) {
      throw error;
    }
  }

  async createBoard(userId: number, body: CreateBoardDto): Promise<any> {
    try {
      const template = await this.prismaService.template.findUnique({
        where: { id: body.templateId },
      });
      if (!template) {
        throw new NotFoundException('Template not found');
      }

      let board = await this.prismaService.board.create({
        data: {
          ...body,
          background: template.defaultBackground,
          creatorId: userId,
        },
      });
      // add invite token to the created board
      const hash = crypto.createHash('sha256');
      const inviteToken = hash.update(String(board.id)).digest('hex');
      board = await this.prismaService.board.update({
        where: { id: board.id },
        data: { inviteToken },
      });

      // create default list
      const listNames = template.defaultList;
      const listsLen = listNames.length;
      for (let i = 0; i < listsLen; i++) {
        const list = await this.prismaService.list.create({
          data: {
            name: listNames[i],
            boardId: board.id,
          },
        });
        board.listsOrder.push(list.id);
      }

      await this.prismaService.board.update({
        where: { id: board.id },
        data: {
          listsOrder: board.listsOrder,
        },
      });

      // create board member relation
      await this.prismaService.boardMember.create({
        data: {
          userId,
          boardId: board.id,
        },
      });

      return {
        board: this.utilService.filterResponse(board),
      };
    } catch (error) {
      throw error;
    }
  }

  async shareBoard(body: ShareBoardDto): Promise<any> {
    try {
      const boardMember = await this.prismaService.boardMember.findUnique({
        where: {
          id: body,
        },
      });
      if (boardMember) {
        throw new BadRequestException(
          'The user is already a member of the board',
        );
      }

      // add new member to board
      await this.prismaService.boardMember.create({
        data: body,
      });

      const result = await this.prismaService.board.findUnique({
        where: { id: body.boardId },
        include: {
          lists: {
            include: {
              cards: true,
            },
          },
          boardMembers: true,
        },
      });

      return {
        board: this.utilService.filterResponse(result),
      };
    } catch (error) {
      throw error;
    }
  }

  async acceptInvitationLink(userId: number, token: string): Promise<any> {
    try {
      const board = await this.prismaService.board.findFirst({
        where: { inviteToken: token },
      });
      if (!board) {
        throw new NotFoundException('Board is not found');
      }

      // add new record to the BoardMember model
      await this.prismaService.boardMember.upsert({
        where: { id: { userId, boardId: board.id } },
        create: {
          userId,
          boardId: board.id,
        },
        update: {},
      });

      return {
        board: this.utilService.filterResponse(board),
      };
    } catch (error) {
      throw error;
    }
  }

  async getBoardMembers(boardId: number, search: string): Promise<any> {
    try {
      let users = await this.prismaService.user.findMany({
        where: {
          boardMembers: {
            some: {
              boardId,
            },
          },
          OR: [
            {
              name: {
                mode: 'insensitive',
                contains: search,
              },
            },
            {
              username: {
                mode: 'insensitive',
                contains: search,
              },
            },
          ],
        },
      });
      users = users.map((user) => this.utilService.filterUserResponse(user));

      return {
        results: users.length,
        users: users,
      };
    } catch (error) {
      throw error;
    }
  }

  async outOfBoard(userId: number, boardId: number): Promise<any> {
    try {
      const boardMember = await this.prismaService.boardMember.findUnique({
        where: { id: { userId, boardId } }
      });
      if (!boardMember) {
        throw new BadRequestException('The user is not a member of this board');
      }

      // delete boardMember
      await this.prismaService.boardMember.delete({
        where: { id: { userId, boardId } }
      });

      // delete all cardAssignee that the user joined
      await this.prismaService.cardAssignee.deleteMany({
        where: {
          assigneeId: userId,
          card: {
            list: {
              boardId
            }
          }
        }
      });

      return null;
    } catch (error) {
      throw error;
    }
  }
}
