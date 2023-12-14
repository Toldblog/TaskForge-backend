import { Injectable, NotFoundException } from '@nestjs/common';
import { UtilService } from 'src/common/providers';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBoardDto, ShareBoardDto } from './dtos';
import * as crypto from 'crypto';
import { AppGateway } from 'src/gateway/app.gateway';

@Injectable()
export class BoardsService {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly utilService: UtilService,
        private readonly appGateway: AppGateway
    ) { }

    async getBoard(id: number): Promise<any> {
        try {
            const board = await this.prismaService.board.findUnique({
                where: { id },
                include: { lists: true, boardMembers: true }
            });

            return {
                Board: this.utilService.filterResponse(board)
            }
        } catch (error) {
            throw error;
        }
    }

    async createBoard(userId: number, body: CreateBoardDto): Promise<any> {
        try {
            const hash = crypto.createHash('sha256');
            const inviteToken = hash.update(body.name).digest('hex');
            const template = await this.prismaService.template.findUnique({
                where: { id: body.templateId }
            });

            if (!template) {
                throw new NotFoundException("Template not found");
            }
            const board = await this.prismaService.board.create({
                data: {
                    ...body,
                    background: template.defaultBackground,
                    creatorId: userId,
                    inviteToken
                }
            });

            // create default list
            const listNames = template.defaultList;
            listNames.forEach(async (name, index) => {
                await this.prismaService.list.create({
                    data: {
                        name,
                        positionInBoard: index + 1,
                        boardId: board.id
                    }
                })
            });
            // create board member relation
            await this.prismaService.boardMember.create({
                data: {
                    userId,
                    boardId: board.id
                }
            });

            return {
                Board: this.utilService.filterResponse(board)
            };
        } catch (error) {
            throw error;
        }
    }

    async joinBoard(userId: number, boardId: number): Promise<any> {
        try {
            await this.prismaService.boardMember.create({
                data: {
                    userId,
                    boardId
                }
            });

            return null;
        } catch (error) {
            throw error;
        }
    }

    async leaveBoard(userId: number, boardId: number): Promise<any> {
        try {
            await this.prismaService.boardMember.delete({
                where: {
                    userId_boardId: {
                        userId,
                        boardId
                    }
                }
            });

            return null;
        } catch (error) {
            throw error;
        }
    }

    async shareBoard(adderId: number, adderName: string, body: ShareBoardDto): Promise<any> {
        try {
            const workspaceMember = await this.prismaService.workspaceMember.findFirst({
                where: {
                    user: {
                        id: body.userId
                    },
                    workspace: {
                        boards: {
                            some: {
                                id: body.boardId
                            }
                        }
                    }
                }
            });
            if (!workspaceMember) {
                throw new NotFoundException('The user should be a member of the workspace');
            }

            // add new member to board
            await this.prismaService.boardMember.create({
                data: body
            });

            // add new notification
            await this.prismaService.notification.create({
                data: {
                    type: 'ADD_TO_BOARD',
                    senderId: adderId,
                    receiverId: body.userId,
                    boardId: body.boardId
                }
            });

            const board = await this.prismaService.board.findUnique({
                where: { id: body.boardId }
            });
            this.appGateway.server.emit(`addToBoard-${body.userId}`, {
                creatorName: adderName,
                boardName: board.name,
                boardId: board.id
            });

            const result = await this.getBoard(body.boardId);
            return result;
        } catch (error) {
            throw error;
        }
    }

    async starredBoard(userId: number, boardId: number): Promise<any> {
        try {
            await this.prismaService.boardMember.update({
                where: {
                    userId_boardId: {
                        userId, boardId
                    }
                },
                data: {
                    starred: true
                }
            });

            return null;
        } catch (error) {
            throw error;
        }
    }

    async joinBoardByLink(userId: number, token: string): Promise<any> {
        try {
            const board = await this.prismaService.board.findFirst({
                where: { inviteToken: token }
            });

            if (!board) {
                throw new NotFoundException("Board is not found");
            }

            // add new row to the BoardMember model
            await this.prismaService.boardMember.create({
                data: {
                    userId,
                    boardId: board.id
                }
            });

            return {
                Board: this.utilService.filterResponse(board)
            }
        } catch (error) {
            throw error;
        }
    }
}
