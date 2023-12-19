import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { UtilService } from 'src/common/providers';
import { AppGateway } from 'src/gateway/app.gateway';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CardsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly utilService: UtilService,
    private readonly appGateway: AppGateway
  ) { }

  async exchangeCardOrders(listId: number, firstCardId: number, secondCardId: number): Promise<any> {
    try {
      let { cardsOrder } = await this.prismaService.list.findUnique({
        where: { id: listId }
      });

      cardsOrder = this.utilService.swapTwoElementsInArray(cardsOrder, firstCardId, secondCardId);
      const list = await this.prismaService.list.update({
        where: { id: listId },
        data: {
          cardsOrder
        },
        include: { cards: true }
      });

      return {
        List: this.utilService.filterResponse(list)
      }
    } catch (error) {
      throw error;
    }
  }

  async getMyAssignedCards(userId: number, boardId: number): Promise<any> {
    try {
      const lists = await this.prismaService.list.findMany({
        where: { boardId },
        include: {
          cards: {
            where: {
              cardAssignees: {
                some: {
                  assigneeId: userId
                }
              }
            },
            include: { cardAssignees: true }
          }
        }
      });

      return {
        Lists: lists.map(list => this.utilService.filterResponse(list))
      }
    } catch (error) {
      throw error;
    }
  }

  async getCardsInBoard(boardId: number, search: string): Promise<any> {
    try {
      const cards = await this.prismaService.card.findMany({
        where: {
          list: {
            boardId
          },
          title: {
            contains: search,
            mode: 'insensitive'
          }
        }
      });

      return {
        Cards: cards.map(card => this.utilService.filterResponse(card))
      }
    } catch (error) {
      throw error;
    }
  }

  async joinCard(userId: number, cardId: number): Promise<any> {
    try {
      const cardAssignee = await this.prismaService.cardAssignee.findUnique({
        where: {
          assigneeId_cardId: { assigneeId: userId, cardId }
        }
      });
      if (cardAssignee) {
        throw new BadRequestException("You already joined this card");
      }

      await this.prismaService.cardAssignee.create({
        data: { assigneeId: userId, cardId }
      });

      const card = await this.prismaService.card.findUnique({
        where: {
          id: cardId
        },
        include: { cardAssignees: true }
      });

      return {
        Card: this.utilService.filterResponse(card)
      }
    } catch (error) {
      throw error;
    }
  }

  async assignMemberToCard(
    assignerId: number, assignerName: string,
    cardId: number, assigneeId: number
  ): Promise<any> {
    try {
      // check if the assignee is in board
      const checkAssignee = await this.prismaService.boardMember.findFirst({
        where: {
          board: {
            lists: {
              some: {
                cards: {
                  some: {
                    id: cardId
                  }
                }
              }
            }
          },
          userId: assigneeId
        }
      });
      if (!checkAssignee) {
        throw new ForbiddenException('The assignee is not a member of the board.');
      }

      // add new record to CardMember model if not exists
      await this.prismaService.cardAssignee.upsert({
        where: { assigneeId_cardId: { assigneeId, cardId } },
        create: {
          assigneeId,
          cardId
        },
        update: {}
      });

      // add new notification
      const card = await this.prismaService.card.findUnique({
        where: { id: cardId }
      })
      await this.prismaService.notification.create({
        data: {
          type: 'ASSIGNMENT',
          senderId: assignerId,
          receiverId: assigneeId,
          cardId
        }
      });
      this.appGateway.server.emit(`assignCard-${assigneeId}`, {
        assigner: assignerName,
        cardTitle: card.title,
        cardId: card.id
      });
    } catch (error) {
      throw error;
    }
  }
}
