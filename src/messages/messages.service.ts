import { PrismaService } from 'src/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { AppGateway } from 'src/gateway/app.gateway';

@Injectable()
export class MessagesService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly appGateway: AppGateway,
  ) { }

  async sendMessage(
    userId: number,
    userName: string,
    boardId: number,
    content: string,
  ): Promise<any> {
    try {
      // Add comment
      const message = await this.prismaService.message.create({
        data: {
          userId,
          boardId,
          content,
        },
      });

      this.appGateway.server.emit(`message-${boardId}`, {
        msg: `message-${boardId}`,
        sender: userName,
        content,
      });

      return {
        message,
      };
    } catch (error) {
      throw error;
    }
  }

  async findAllMessages(userId: number): Promise<any> {
    const res = await this.prismaService.message.findMany({
      where: { userId }
    });

    return res;
  }
}
