import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { UtilService } from 'src/common/providers';
import { PrismaService } from 'src/prisma/prisma.service';
import { Response } from 'express';

@Injectable()
export class CardsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly utilService: UtilService,
    private readonly configService: ConfigService,
  ) { }

  private supabase = createClient(
    this.configService.get('SUPABASE_URL'),
    this.configService.get('SUPABASE_API_KEY'),
  );

  async moveCardInList(
    listId: number,
    cardId: number,
    newIndex: number,
  ): Promise<any> {
    try {
      let { cardsOrder } = await this.prismaService.list.findUnique({
        where: { id: listId },
      });

      cardsOrder = cardsOrder.filter(id => id !== cardId);
      cardsOrder = [
        ...cardsOrder.slice(0, newIndex),
        cardId,
        ...cardsOrder.slice(newIndex)
      ]

      const list = await this.prismaService.list.update({
        where: { id: listId },
        data: {
          cardsOrder,
        },
        include: { cards: true },
      });

      return {
        list: this.utilService.filterResponse(list),
      };
    } catch (error) {
      throw error;
    }
  }

  async moveCardToAnotherList(
    cardId: number,
    oldListId: number,
    newListId: number,
    newIndex: number,
  ): Promise<any> {
    try {
      // Update listId of card
      await this.prismaService.card.update({
        where: { id: cardId },
        data: { listId: newListId }
      });

      // Update cardsOrder of old list
      const { cardsOrder } = await this.prismaService.list.findUnique({
        where: { id: oldListId },
      });
      await this.prismaService.list.update({
        where: { id: oldListId },
        data: { cardsOrder: cardsOrder.filter(id => id !== cardId) }
      });

      // Update cardsOrder for new list
      let { cardsOrder: newCardsOrder } = await this.prismaService.list.findUnique({
        where: { id: newListId },
      });
      newCardsOrder = [
        ...newCardsOrder.slice(0, newIndex),
        cardId,
        ...newCardsOrder.slice(newIndex)
      ]

      const list = await this.prismaService.list.update({
        where: { id: newListId },
        data: {
          cardsOrder: newCardsOrder,
        },
        include: { cards: true },
      });

      return {
        list: this.utilService.filterResponse(list),
      };
    } catch (error) {
      throw error;
    }
  }

  async deleteCard(cardId: number): Promise<any> {
    try {
      const list = await this.prismaService.list.findFirst({
        where: {
          cards: { some: { id: cardId } },
        },
      });

      // delete card
      await this.prismaService.card.delete({
        where: { id: cardId },
      });

      // update cardsOrder of the list
      await this.prismaService.list.update({
        where: { id: list.id },
        data: {
          cardsOrder: list.cardsOrder.filter((id) => id !== cardId),
        },
      });

      return null;
    } catch (error) {
      throw error;
    }
  }

  async getCardsInBoard(boardId: number, search: string): Promise<any> {
    try {
      const lists = await this.prismaService.list.findMany({
        where: {
          boardId,
          cards: {
            some: {
              title: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
        },
        include: { cards: true },
      });

      return {
        results: lists.length,
        lists: lists.map((list) => this.utilService.filterResponse(list)),
      };
    } catch (error) {
      throw error;
    }
  }

  async joinCard(userId: number, cardId: number): Promise<any> {
    try {
      const cardAssignee = await this.prismaService.cardAssignee.findUnique({
        where: {
          id: { assigneeId: userId, cardId },
        },
      });
      if (cardAssignee) {
        throw new BadRequestException('You already joined this card');
      }

      await this.prismaService.cardAssignee.create({
        data: { assigneeId: userId, cardId },
      });

      const card = await this.prismaService.card.findUnique({
        where: {
          id: cardId,
        },
        include: { cardAssignees: true },
      });

      return {
        card: this.utilService.filterResponse(card),
      };
    } catch (error) {
      throw error;
    }
  }

  async assignMemberToCard(
    cardId: number,
    assigneeId: number,
  ): Promise<any> {
    try {
      // check if the assignee is in board
      const checkAssigneeInBoard = await this.prismaService.boardMember.findFirst({
        where: {
          board: {
            lists: {
              some: {
                cards: {
                  some: {
                    id: cardId,
                  },
                },
              },
            },
          },
          userId: assigneeId,
        },
      });
      if (!checkAssigneeInBoard) {
        throw new ForbiddenException(
          'The assignee is not a member of the board.',
        );
      }

      // check if the assignee is already assigned to card
      const checkAssignee = await this.prismaService.cardAssignee.findUnique({
        where: {
          id: { assigneeId, cardId }
        }
      });

      if (checkAssignee) {
        // remove out of card
        await this.prismaService.cardAssignee.delete({
          where: { id: { assigneeId, cardId } }
        });
        return null;
      } else {
        // add new record to CardMember model if not exists
        await this.prismaService.cardAssignee.create({
          data: {
            assigneeId,
            cardId,
          }
        });

        // add new notification
        const card = await this.prismaService.card.findUnique({
          where: { id: cardId },
          include: {
            cardAssignees: true
          }
        });

        return {
          card: this.utilService.filterResponse(card),
        };
      }
    } catch (error) {
      throw error;
    }
  }

  async uploadAttachmentFile(
    id: number,
    attachment: Express.Multer.File,
  ): Promise<any> {
    try {
      // create random file name
      const fileName = attachment.originalname + '_' + Date.now().toString();

      // upload file
      const { error: storageError } = await this.supabase.storage
        .from('attachments') // Bucket name
        .upload(fileName, attachment.buffer);

      if (storageError) {
        throw new Error(storageError.message);
      }

      // add new record to CardAttachment model
      const cardAttachment = await this.prismaService.cardAttachment.create({
        data: {
          fileName,
          url: `${this.configService.get(
            'SUPABASE_URL',
          )}/storage/v1/object/public/attachments/${fileName?.replace(
            /\s/g,
            '',
          )}`,
          type: 'FILE',
          cardId: id,
        },
      });

      return {
        cardAttachment: cardAttachment,
      };
    } catch (error) {
      throw error;
    }
  }

  async deleteAttachment(userId: number, attachmentId: number): Promise<any> {
    try {
      // Check attachment
      const attachment = await this.prismaService.cardAttachment.findUnique({
        where: { id: attachmentId },
      });
      if (!attachment) {
        throw new NotFoundException('Attachment not found');
      }
      // Check user permission
      const boardMember = await this.prismaService.boardMember.findFirst({
        where: {
          userId,
          board: {
            lists: {
              some: {
                cards: {
                  some: {
                    id: attachment.cardId,
                  },
                },
              },
            },
          },
        },
      });
      if (!boardMember) {
        throw new ForbiddenException(
          'You are not member of the board to do this request',
        );
      }

      // delete attachment
      await this.prismaService.cardAttachment.delete({
        where: { id: attachmentId },
      });

      return null;
    } catch (error) {
      throw error;
    }
  }

  async downloadFile(
    userId: number,
    attachmentId: number,
    res: Response,
  ): Promise<any> {
    try {
      // Check attachment
      const attachment = await this.prismaService.cardAttachment.findUnique({
        where: { id: attachmentId },
      });
      if (!attachment) {
        throw new NotFoundException('Attachment not found');
      }
      // Check user permission
      const boardMember = await this.prismaService.boardMember.findFirst({
        where: {
          userId,
          board: {
            lists: {
              some: {
                cards: {
                  some: {
                    id: attachment.cardId,
                  },
                },
              },
            },
          },
        },
      });
      if (!boardMember) {
        throw new ForbiddenException(
          'You are not member of the board to do this request',
        );
      }

      // donwload file
      const { data, error } = await this.supabase.storage
        .from('attachments')
        .download(attachment.fileName);

      if (error) {
        throw new Error(error.message);
      }

      const blob = data;
      const buffer = Buffer.from(await blob.arrayBuffer());
      res.set({
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${attachment.fileName}"`,
      });
      res.send(buffer);
    } catch (error) {
      throw error;
    }
  }
}
