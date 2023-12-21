import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { UtilService } from 'src/common/providers';
import { AppGateway } from 'src/gateway/app.gateway';
import { PrismaService } from 'src/prisma/prisma.service';
import { Response } from 'express';

@Injectable()
export class CardsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly utilService: UtilService,
    private readonly appGateway: AppGateway,
    private readonly configService: ConfigService
  ) { }

  private supabase = createClient(
    this.configService.get('SUPABASE_URL'),
    this.configService.get('SUPABASE_API_KEY'),
  );

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
        list: this.utilService.filterResponse(list)
      }
    } catch (error) {
      throw error;
    }
  }

  async deleteCard(cardId: number): Promise<any> {
    try {
      const list = await this.prismaService.list.findFirst({
        where: {
          cards: { some: { id: cardId } }
        }
      });

      // delete card
      await this.prismaService.card.delete({
        where: { id: cardId }
      });

      // update cardsOrder of the list
      await this.prismaService.list.update({
        where: { id: list.id },
        data: {
          cardsOrder: list.cardsOrder.filter(id => id !== cardId)
        }
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
                mode: 'insensitive'
              }
            }
          }
        },
        include: { cards: true }
      });

      return {
        results: lists.length,
        lists: lists.map(list => this.utilService.filterResponse(list))
      }
    } catch (error) {
      throw error;
    }
  }

  async joinCard(userId: number, cardId: number): Promise<any> {
    try {
      const cardAssignee = await this.prismaService.cardAssignee.findUnique({
        where: {
          id: { assigneeId: userId, cardId }
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
        card: this.utilService.filterResponse(card)
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
        where: { id: { assigneeId, cardId } },
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

  async uploadAttachmentFile(id: number, attachment: Express.Multer.File): Promise<any> {
    try {
      // create random file name
      const fileName = attachment.originalname;

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
          url: `${this.configService.get('SUPABASE_URL')}/storage/v1/object/public/attachments/${fileName?.replace(/\s/g, '')}`,
          type: 'FILE',
          cardId: id
        }
      });

      return {
        attachment: cardAttachment
      }
    } catch (error) {
      throw error;
    }
  }

  async deleteAttachment(userId: number, attachmentId: number): Promise<any> {
    try {
      // Check attachment
      const attachment = await this.prismaService.cardAttachment.findUnique({
        where: { id: attachmentId }
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
                    id: attachment.cardId
                  }
                }
              }
            }
          }
        }
      });
      if (!boardMember) {
        throw new ForbiddenException("You are not member of the board to do this request");
      }

      // delete attachment
      await this.prismaService.cardAttachment.delete({
        where: { id: attachmentId }
      });

      return null;
    } catch (error) {
      throw error;
    }
  }

  async downloadFile(userId: number, attachmentId: number, res: Response): Promise<any> {
    try {
      // Check attachment
      const attachment = await this.prismaService.cardAttachment.findUnique({
        where: { id: attachmentId }
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
                    id: attachment.cardId
                  }
                }
              }
            }
          }
        }
      });
      if (!boardMember) {
        throw new ForbiddenException("You are not member of the board to do this request");
      }

      // donwload file
      const { data, error } = await this.supabase.storage
        .from('attachments')
        .download(attachment.fileName)

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
