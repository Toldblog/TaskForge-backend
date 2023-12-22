import {
  Controller,
  UseInterceptors,
  UseGuards,
  Get,
  ParseIntPipe,
  Param,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards';
import { ResponseInterceptor } from 'src/common/interceptors';
import { BoardGuard } from 'src/common/guards';
import { CRUDService, UtilService } from 'src/common/providers';

@Controller('messages')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ResponseInterceptor)
export class MessagesController {
  constructor(
    private readonly crudService: CRUDService,
    private readonly utilService: UtilService,
  ) {}

  @Get(':boardId')
  @UseGuards(BoardGuard)
  async getMessagesByBoard(
    @Param('boardId', ParseIntPipe) boardId: number,
  ): Promise<any> {
    try {
      let result = await this.crudService.getAll(
        'message',
        {
          boardId,
        },
        { sender: true },
      );

      result = result['messages'].map((message) => ({
        ...message,
        sender: this.utilService.filterUserResponse(message.sender),
      }));
      return result;
    } catch (error) {
      throw error;
    }
  }
}
