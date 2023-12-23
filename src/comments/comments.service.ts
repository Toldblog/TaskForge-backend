import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { UtilService } from 'src/common/providers';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CommentsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly utilService: UtilService,
  ) {}

  async deleteComment(userId: number, commentId: number): Promise<any> {
    try {
      // check comment
      const comment = await this.prismaService.comment.findUnique({
        where: { id: commentId },
      });
      if (!comment) {
        throw new NotFoundException('Comment not found');
      }
      // check comment's editing permission
      if (comment.userId !== userId) {
        throw new ForbiddenException(
          'You are not allowed to edit this comment',
        );
      }

      // delete comment
      await this.prismaService.comment.delete({
        where: { id: commentId },
      });

      return null;
    } catch (error) {
      throw error;
    }
  }

  async editComment(
    userId: number,
    commentId: number,
    content: string,
  ): Promise<any> {
    try {
      // check comment
      const comment = await this.prismaService.comment.findUnique({
        where: { id: commentId },
      });
      if (!comment) {
        throw new NotFoundException('Comment not found');
      }
      // check comment's editing permission
      if (comment.userId !== userId) {
        throw new ForbiddenException(
          'You are not allowed to edit this comment',
        );
      }

      // update comment
      const updatedComment = await this.prismaService.comment.update({
        where: { id: commentId },
        data: { content },
        include: { commenter: true },
      });

      return {
        comment: {
          ...updatedComment,
          commenter: this.utilService.filterUserResponse(
            updatedComment.commenter,
          ),
        },
      };
    } catch (error) {
      throw error;
    }
  }

  async commentOnCard(
    userId: number,
    cardId: number,
    content: string,
  ): Promise<any> {
    try {
      // Check card
      const card = await this.prismaService.card.findUnique({
        where: { id: cardId },
      });
      if (!card) {
        throw new NotFoundException('Card not found');
      }

      // Check if user is in board
      const checkUser = await this.prismaService.boardMember.findFirst({
        where: {
          user: { id: userId },
          board: {
            lists: {
              some: {
                id: card.listId,
              },
            },
          },
        },
      });
      if (!checkUser) {
        throw new ForbiddenException('You are not a member of the board');
      }

      // Add comment
      const comment = await this.prismaService.comment.create({
        data: {
          userId,
          cardId,
          content,
        },
      });

      // Find all userIDs assigned to the card
      // const cardAssignees = await this.prismaService.cardAssignee.findMany({
      //   where: { cardId },
      // });
      // const assigneeIds = cardAssignees
      //   .map((item) => item.assigneeId)
      //   .filter((id) => id !== userId);
      // assigneeIds?.forEach(async (assigneeId) => {
      //   // add new notification
      //   await this.prismaService.notification.create({
      //     data: {
      //       type: 'COMMENT',
      //       senderId: userId,
      //       receiverId: assigneeId,
      //       cardId,
      //     },
      //   });
      // });

      return {
        comment
      };
    } catch (error) {
      throw error;
    }
  }
}
