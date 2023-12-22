import { PrismaService } from 'src/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { Message } from '@prisma/client';

@Injectable()
export class MessagesService {
  constructor(private readonly prismaService: PrismaService) {}

  async sendMessage(
    userId: number,
    boardId: number,
    content: string,
  ): Promise<Message> {
    try {
      // Add messages
      const message = await this.prismaService.message.create({
        data: {
          userId,
          boardId,
          content,
        },
      });
      return message;
    } catch (error) {
      throw error;
    }
  }

  async findAllMessages(boardId: number): Promise<any> {
    const message = await this.prismaService.message.findMany({
      where: { boardId },
    });

    return { message };
  }
}
