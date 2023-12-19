import { PrismaService } from 'src/prisma/prisma.service';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppGateway } from 'src/gateway/app.gateway';

@Injectable()
export class MessagesService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly appGateway: AppGateway,
  ) {}

  async sendMessage(
    userId: number,
    userName: string,
    boardId: number,
    content: string,
  ): Promise<any> {
    try {
      // Check card
      const board = await this.prismaService.board.findUnique({
        where: { id: boardId },
      });
      if (!board) {
        throw new NotFoundException('Board not found');
      }

      // Check if user is in board
      const checkUser = await this.prismaService.boardMember.findUnique({
        where: {
          userId_boardId: {
            userId,
            boardId,
          },
        },
      });
      console.log(userId, boardId);

      if (!checkUser) {
        throw new ForbiddenException('You are not a member of the board');
      }

      // Add comment
      const message = await this.prismaService.message.create({
        data: {
          userId,
          boardId,
          content,
        },
      });

      // Find all userIDs assigned to the card
      // const boardMembers = await this.prismaService.boardMember.findMany({
      //   where: { boardId },
      // });
      // const memberIds = boardMembers
      //   .map((item) => item.userId)
      //   .filter((id) => id !== userId);
      // memberIds?.forEach(async (memberId) => {
      //   // add new notification
      this.appGateway.server.emit(`message-${boardId}`, {
        msg: `message-${boardId}`,
        sender: userName,
        content,
      });
      // });

      return {
        message,
      };
    } catch (error) {
      throw error;
    }
  }

  async findAllMessages(userId: number): Promise<any> {
    const res = await this.prismaService.notification.findMany({
      where: {
        receiverId: userId,
      },
    });

    return res;
  }
}
