import { Injectable, CanActivate, ExecutionContext, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from './roles.enum';

@Injectable()
export class ListGuard implements CanActivate {
  constructor(private readonly prismaService: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    let listId = null;

    if (request.route.path.includes('/lists') && request.route.path.includes('/:id')) {
      listId = request.params.id;
    } else if (request.route.path.includes(':listId')) {
      listId = request.params.listId;
    } else if (Object.keys(request.body).includes('listId')) {
      listId = request.body.listId;
    }
    if (!listId) return true;

    const list = await this.prismaService.list.findUnique({
      where: { id: Number(listId) },
    });
    if (!list) {
      throw new NotFoundException('List not found');
    }

    const board = await this.prismaService.board.findFirst({
      where: {
        lists: {
          some: {
            id: Number(listId),
          },
        },
      },
    });
    if (!board) {
      throw new NotFoundException('A board that the list belongs to not found');
    }
    if (board.closed && !Object.keys(request.body).includes('closed')) {
      throw new ForbiddenException('A board that the list belongs to is already closed');
    }

    // If ADMIN accesses the route, return true
    if (user.role === Role.ADMIN) return true;

    if (request.method === 'GET') {
      if (board?.visibility || board?.creatorId === user.id) return true;
    }
    const boardMember = await this.prismaService.boardMember.findUnique({
      where: {
        id: {
          userId: user.id,
          boardId: board.id,
        },
      },
    });
    if (!boardMember) {
      throw new ForbiddenException('You are not a member of the board to do this request');
    }

    return true;
  }
}
