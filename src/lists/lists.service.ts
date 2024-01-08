import { Injectable, NotFoundException } from '@nestjs/common';
import { UtilService } from '../common/providers';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ListsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly utilService: UtilService,
  ) {}

  async deleteList(listId: number): Promise<any> {
    try {
      const board = await this.prismaService.board.findFirst({
        where: {
          lists: { some: { id: listId } },
        },
      });

      // delete list
      await this.prismaService.list.delete({
        where: { id: listId },
      });

      // update listsOrder of the board
      await this.prismaService.board.update({
        where: { id: board.id },
        data: {
          listsOrder: board.listsOrder.filter((id) => id !== listId),
        },
      });

      return null;
    } catch (error) {
      throw error;
    }
  }

  async moveList(boardId: number, listId: number, newIndex: number): Promise<any> {
    try {
      let { listsOrder } = await this.prismaService.board.findUnique({
        where: { id: boardId },
      });

      listsOrder = listsOrder.filter((id) => id !== listId);
      listsOrder = [...listsOrder.slice(0, newIndex), listId, ...listsOrder.slice(newIndex)];

      const board = await this.prismaService.board.update({
        where: { id: boardId },
        data: {
          listsOrder,
        },
        include: {
          lists: {
            include: {
              cards: {
                include: {
                  cardAttachments: true,
                  cardAssignees: {
                    include: { assignee: true },
                  },
                  comments: true,
                },
              },
            },
          },
        },
      });

      return {
        board: this.utilService.filterResponse(board),
      };
    } catch (error) {
      throw error;
    }
  }

  async copyList(listId: number, listName: string): Promise<any> {
    try {
      const list = await this.prismaService.list.findUnique({
        where: { id: listId },
        include: {
          cards: {
            include: { cardAttachments: true },
          },
        },
      });
      const board = await this.prismaService.board.findFirst({
        where: {
          id: list.boardId,
        },
      });

      // copy list
      const copyList = await this.prismaService.list.create({
        data: {
          name: listName,
          boardId: list.boardId,
        },
      });
      await this.prismaService.board.update({
        where: { id: board.id },
        data: { listsOrder: [...board.listsOrder, copyList.id] },
      });

      // copy cards
      const cardsOrder = [];
      const lenCards = list.cards.length;
      for (let i = 0; i < lenCards; i++) {
        const copyCard = await this.prismaService.card.create({
          data: {
            title: list.cards[i].title,
            description: list.cards[i].description,
            dueDate: list.cards[i].dueDate,
            reminderDate: list.cards[i].reminderDate,
            listId: copyList.id,
          },
        });
        cardsOrder.push(copyCard.id);

        // copy card attachments
        list.cards[i].cardAttachments.forEach(async (attachment) => {
          await this.prismaService.cardAttachment.create({
            data: {
              fileName: attachment.fileName,
              url: attachment.url,
              type: attachment.type,
              cardId: copyCard.id,
            },
          });
        });
      }

      // update cardsOrder of the list
      const result = await this.prismaService.list.update({
        where: { id: copyList.id },
        data: { cardsOrder },
        include: { cards: { include: { cardAttachments: true } } },
      });

      return {
        list: result,
      };
    } catch (error) {
      throw error;
    }
  }

  async moveAllCardsInList(listId: number, destinationListId: number): Promise<any> {
    try {
      const destinationList = await this.prismaService.list.findUnique({
        where: { id: destinationListId },
      });
      if (!destinationList) {
        throw new NotFoundException('Destination list not found');
      }

      const list = await this.prismaService.list.findUnique({
        where: { id: listId },
        include: { cards: true },
      });

      const len = list.cards.length;
      const cardsOrder = [...destinationList.cardsOrder];
      for (let i = 0; i < len; i++) {
        // update listId of card
        await this.prismaService.card.update({
          where: { id: list.cards[i].id },
          data: { listId: destinationListId },
        });
        cardsOrder.push(list.cards[i].id);
      }
      // update cardsOrder of currentList and destinationList
      await this.prismaService.list.update({
        where: { id: listId },
        data: { cardsOrder: [] },
      });

      const updatedList = await this.prismaService.list.update({
        where: { id: destinationListId },
        data: { cardsOrder },
        include: { cards: true },
      });

      return {
        list: this.utilService.filterResponse(updatedList),
      };
    } catch (error) {
      throw error;
    }
  }

  async deleteAllCardsInList(listId: number): Promise<any> {
    try {
      await this.prismaService.card.deleteMany({
        where: {
          listId: listId,
        },
      });

      await this.prismaService.list.update({
        where: { id: listId },
        data: { cardsOrder: [] },
      });

      return null;
    } catch (error) {
      throw error;
    }
  }
}
