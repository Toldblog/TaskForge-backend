import { Injectable, CanActivate, ExecutionContext, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from './roles.enum';

@Injectable()
export class CardGuard implements CanActivate {
  constructor(private readonly prismaService: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    let cardId = null;

    if (request.route.path.includes('/cards') && request.route.path.includes('/:id')) {
      cardId = request.params.id;
    } else if (request.route.path.includes(':cardId')) {
      cardId = request.params.cardId;
    } else if (Object.keys(request.body).includes('cardId')) {
      cardId = request.body.cardId;
    }
    if (!cardId) return true;

    const card = await this.prismaService.card.findUnique({
      where: { id: Number(cardId) },
    });
    if (!card) {
      throw new NotFoundException('Card not found');
    }

    const board = await this.prismaService.board.findFirst({
      where: {
        lists: {
          some: {
            cards: {
              some: {
                id: Number(cardId),
              },
            },
          },
        },
      },
    });
    if (!board) {
      throw new NotFoundException('A board that the card belongs to not found');
    }
    if (board.closed && !Object.keys(request.body).includes('closed')) {
      throw new ForbiddenException('A board that the card belongs to is already closed');
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
