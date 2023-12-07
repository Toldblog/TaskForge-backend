import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AppGateway } from 'src/gateway/app.gateway';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CardsService {
  constructor(
    private prismaService: PrismaService,
    private readonly appGateway: AppGateway
  ) { }

  async assignMemberToCard(
    assignerId: number, assignerName: string,
    cardId: number, userId: number
  ): Promise<any> {
    try {
      // check card
      const card = await this.prismaService.card.findUnique({
        where: { id: cardId }
      });
      if (!card) {
        throw new NotFoundException('Card not found')
      }

      // check if assigner and assignee is in board
      const list = await this.prismaService.list.findUnique({
        where: { id: card.listId }
      });
      const checkAssigner = await this.prismaService.boardMember.findUnique({
        where: {
          userId_boardId: {
            userId: assignerId,
            boardId: list.boardId
          }
        }
      });
      const checkAssignee = await this.prismaService.boardMember.findUnique({
        where: {
          userId_boardId: {
            userId,
            boardId: list.boardId
          }
        }
      });
      if (!checkAssigner) {
        throw new ForbiddenException('You are not a member of the board.');
      }
      if (!checkAssignee) {
        throw new ForbiddenException('The assigner is not a member of the board.');
      }

      // add assigner to card
      await this.prismaService.cardAssignee.create({
        data: {
          assigneeId: userId,
          cardId
        }
      });

      // add new notification
      await this.prismaService.notification.create({
        data: {
          type: 'ASSIGNMENT',
          senderId: assignerId,
          receiverId: userId,
          cardId
        }
      });
      this.appGateway.server.emit(`assignCard-${userId}`, {
        assigner: assignerName,
        cardTitle: card.title
      });
    } catch (error) {
      throw error;
    }
  }
}
