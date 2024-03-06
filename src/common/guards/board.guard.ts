import { Injectable, CanActivate, ExecutionContext, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Role } from './roles.enum';

@Injectable()
export class BoardGuard implements CanActivate {
    constructor(
        private readonly prismaService: PrismaService
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        let boardId = null;

        if (request.route.path.includes('/boards') && request.route.path.includes('/:id')) {
            boardId = request.params.id;
        }
        else if (request.route.path.includes(':boardId')) {
            boardId = request.params.boardId;
        }
        else if (Object.keys(request.body).includes('boardId')) {
            boardId = request.body.boardId;
        }
        if (!boardId) return true;

        const board = await this.prismaService.board.findUnique({
            where: { id: Number(boardId) }
        });
        if (!board) {
            throw new NotFoundException("Board not found");
        }
        if (board.closed && !Object.keys(request.body).includes('closed')) {
            if (
                !((request.method === "GET" || request.method === "DELETE") && request.route.path.includes('/boards/:id')) &&
                !request.route.path.includes('/leave-board/:id')
            )
                throw new ForbiddenException("This board is already closed");
        }

        // If ADMIN accesses the route, return true
        if (user.role === Role.ADMIN)
            return true;

        const boardMember = await this.prismaService.boardMember.findUnique({
            where: {
                id: {
                    userId: user.id,
                    boardId: Number(boardId)
                }
            }
        });
        if (request.method === "GET") {
            // meaning that all the members of workspace or the board creator can get
            if (board?.visibility || board?.creatorId === user.id) return true;

            if (boardMember) return true;
            else
                throw new ForbiddenException("The board is only accessed by its members");
        } else if (
            (request.method === "PATCH" && request.route.path.includes("/boards/:id")) ||
            (request.method === "DELETE" && request.route.path.includes("/boards/:id")) ||
            (request.method === "DELETE" && request.route.path.includes("/:boardId/remove-board-member/:userId"))
        ) {
            if (board.creatorId !== user.id) {
                throw new ForbiddenException("You are not the creator of this board");
            }
        } else if (request.method === "POST" && request.route.path.includes('/join-board')) {
            if (boardMember)
                throw new BadRequestException("You are already a member of this board");
            if (!board.visibility) {
                throw new ForbiddenException("This board is private");
            }
        } else {
            if (boardMember) return true;
            else
                throw new BadRequestException("You are not a member of this board");
        }

        return true;
    }
}
