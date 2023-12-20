import { Injectable } from '@nestjs/common';
import { UtilService } from 'src/common/providers';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ListsService {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly utilService: UtilService,
    ) { }

    async deleteList(listId: number): Promise<any> {
        try {
            const board = await this.prismaService.board.findFirst({
                where: {
                    lists: { some: { id: listId } }
                }
            });

            // delete list
            await this.prismaService.list.delete({
                where: { id: listId }
            });

            // update listsOrder of the board
            await this.prismaService.board.update({
                where: { id: board.id },
                data: {
                    listsOrder: board.listsOrder.filter(id => id !== listId)
                }
            });

            return null;
        } catch (error) {
            throw error;
        }
    }

    async exchangeListOrders(boardId: number, firstListId: number, secondListId: number): Promise<any> {
        try {
            let { listsOrder } = await this.prismaService.board.findUnique({
                where: { id: boardId }
            });

            listsOrder = this.utilService.swapTwoElementsInArray(listsOrder, firstListId, secondListId);
            const board = await this.prismaService.board.update({
                where: { id: boardId },
                data: {
                    listsOrder
                },
                include: {
                    lists: {
                        include: { cards: true }
                    }
                }
            });

            return {
                board: this.utilService.filterResponse(board)
            }
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
                        include: { cardAttachments: true }
                    }
                }
            });
            const board = await this.prismaService.board.findFirst({
                where: {
                    id: list.boardId
                }
            });

            // copy list
            const copyList = await this.prismaService.list.create({
                data: {
                    name: listName,
                    boardId: list.boardId,
                }
            });
            await this.prismaService.board.update({
                where: { id: board.id },
                data: { listsOrder: [...board.listsOrder, copyList.id] }
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
                        listId: copyList.id
                    }
                });
                cardsOrder.push(copyCard.id);

                // copy card attachments
                list.cards[i].cardAttachments.forEach(async attachment => {
                    await this.prismaService.cardAttachment.create({
                        data: {
                            fileName: attachment.fileName,
                            url: attachment.url,
                            type: attachment.type,
                            cardId: copyCard.id
                        }
                    });
                });
            }

            // update cardsOrder of the list
            const result = await this.prismaService.list.update({
                where: { id: copyList.id },
                data: { cardsOrder },
                include: { cards: { include: { cardAttachments: true } } }
            });

            return {
                list: result
            }
        } catch (error) {
            throw error;
        }
    }
}
