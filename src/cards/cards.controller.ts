import {
  Controller,
  UseInterceptors,
  UseGuards,
  Post,
  Param,
  ParseIntPipe,
  Get,
  Query,
  Delete,
  Body,
  Patch,
  UploadedFile,
  Res
} from '@nestjs/common';
import { CardsService } from './cards.service';
import { JwtAuthGuard } from 'src/auth/guards';
import { BoardGuard, CardGuard, ListGuard, Role, Roles, RolesGuard } from 'src/common/guards';
import { ResponseInterceptor } from 'src/common/interceptors';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { User } from '@prisma/client';
import { CRUDService } from 'src/common/providers';
import { AssignCardDto, CreateCardDto, ExchangeCardOrdersDto, MoveCardDto, UpdateCardDto, UploadLinkDto } from './dtos';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';

@Controller('cards')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(ResponseInterceptor)
export class CardsController {
  constructor(
    private cardsService: CardsService,
    private crudService: CRUDService
  ) { }

  @Get()
  @Roles(Role.ADMIN)
  async getAllCards(@Query() options: any): Promise<any> {
    try {
      const result = await this.crudService.getAll("card", options);
      return result;
    } catch (error) {
      throw error;
    }
  }

  @Get(':id')
  @UseGuards(CardGuard)
  async getCard(@Param('id', ParseIntPipe) id: number): Promise<any> {
    try {
      const result = await this.crudService.getOne('card', id);
      return result;
    } catch (error) {
      throw error;
    }
  }

  @Post()
  @UseGuards(ListGuard)
  async createCard(@Body() body: CreateCardDto): Promise<any> {
    try {
      const result = await this.crudService.createOne('card', body);

      // update cardsOrder of the list
      const cardId = result["card"].id;
      const { list } = await this.crudService.getOne('list', body.listId);
      await this.crudService.updateOne('list', body.listId, {
        cardsOrder: [...list.cardsOrder, cardId]
      });

      return result;
    } catch (error) {
      throw error;
    }
  }

  @Patch('exchange-orders')
  @UseGuards(ListGuard)
  exchangeCardOrders(@Body() body: ExchangeCardOrdersDto): any {
    return this.cardsService.exchangeCardOrders(body.listId, body.firstCardId, body.secondCardId);
  }

  @Patch('move-card/:id')
  @UseGuards(ListGuard, CardGuard)
  async moveCard(@Param('id', ParseIntPipe) id: number, @Body() body: MoveCardDto): Promise<any> {
    try {
      const result = await this.crudService.updateOne('card', id, { listId: body.listId });

      // Update cardsOrder of the list
      const { list } = await this.crudService.getOne('list', body.listId);
      const index = body.order - 1;
      await this.crudService.updateOne('list', body.listId, {
        cardsOrder: [
          ...list.cardsOrder.slice(0, index),
          id,
          ...list.cardsOrder.slice(index)
        ]
      });

      return result;
    } catch (error) {
      throw error;
    }
  }

  @Patch(':id')
  @UseGuards(CardGuard)
  async updateCard(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateCardDto): Promise<any> {
    try {
      const result = await this.crudService.updateOne('card', id, body);
      return result;
    } catch (error) {
      throw error;
    }
  }

  @Delete(':id')
  @UseGuards(CardGuard)
  deleteCard(@Param('id', ParseIntPipe) id: number): any {
    return this.cardsService.deleteCard(id);
  }

  @Get('my-cards/:boardId')
  @UseGuards(BoardGuard)
  async getMyAssignedCards(@GetUser() user: User, @Param("boardId", ParseIntPipe) boardId: number): Promise<any> {
    try {
      const result = await this.crudService.getAll('list', {
        boardId,
        cards: {
          some: { cardAssignees: { some: { assigneeId: user.id } } }
        }
      }, {
        cards: true
      });

      return result;
    } catch (error) {
      throw error;
    }
  }

  @Get('in-board/:boardId')
  @UseGuards(BoardGuard)
  getCardsInBoard(@Param('boardId', ParseIntPipe) boardId: number, @Query('search') search: string): any {
    return this.cardsService.getCardsInBoard(boardId, search);
  }

  @Post('join/:id')
  @UseGuards(CardGuard)
  joinCard(@GetUser() user: User, @Param('id', ParseIntPipe) cardId: number): any {
    return this.cardsService.joinCard(user.id, cardId);
  }

  @Post('assign')
  @UseGuards(CardGuard)
  assignMemberToCard(@GetUser() assigner: User, @Body() body: AssignCardDto): any {
    return this.cardsService.assignMemberToCard(body.cardId, body.assigneeId);
  }

  @Post('upload-file/:id')
  @UseGuards(CardGuard)
  @UseInterceptors(FileInterceptor('attachment'))
  uploadAttachmentFile(@Param('id', ParseIntPipe) id: number, @UploadedFile() attachment: Express.Multer.File): any {
    return this.cardsService.uploadAttachmentFile(id, attachment);
  }

  @Post('upload-link/:id')
  @UseGuards(CardGuard)
  async uploadAttachmentLink(@Param('id', ParseIntPipe) id: number, @Body() body: UploadLinkDto): Promise<any> {
    try {
      const result = await this.crudService.createOne('cardAttachment', {
        ...body,
        cardId: id,
        type: "LINK"
      });

      return result;
    } catch (error) {
      throw error;
    }
  }

  @Delete('delete-attachment/:attachmentId')
  deleteAttachment(@GetUser() user: User, @Param('attachmentId', ParseIntPipe) attachmentId: number): any {
    return this.cardsService.deleteAttachment(user.id, attachmentId);
  }

  @Get('download-file/:attachmentId')
  downloadFile(@GetUser() user: User, @Param('attachmentId', ParseIntPipe) attachmentId: number, @Res() res: Response): void {
    this.cardsService.downloadFile(user.id, attachmentId, res);
  }
}
