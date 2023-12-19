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
  Patch
} from '@nestjs/common';
import { CardsService } from './cards.service';
import { JwtAuthGuard } from 'src/auth/guards';
import { BoardGuard, CardGuard, ListGuard, Role, Roles, RolesGuard } from 'src/common/guards';
import { ResponseInterceptor } from 'src/common/interceptors';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { User } from '@prisma/client';
import { CRUDService } from 'src/common/providers';
import { AssignCardDto, CreateCardDto, ExchangeCardOrdersDto, MoveCardDto, UpdateCardDto } from './dtos';

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
      const result = await this.crudService.getAll("Card", options);
      return result;
    } catch (error) {
      throw error;
    }
  }

  @Get(':id') 
  @UseGuards(CardGuard)
  async getCard(@Param('id') id: string): Promise<any> {
    try {
      const result = await this.crudService.getOne('Card', id);
      return result;
    } catch (error) {
      throw error;
    }
  }

  @Post() 
  @UseGuards(ListGuard)
  async createCard(@Body() body: CreateCardDto): Promise<any> {
    try {
      const result = await this.crudService.createOne('Card', body);

      // update cardsOrder of the list
      const cardId = result["Card"].id;
      const { List: list } = await this.crudService.getOne('List', String(body.listId));
      await this.crudService.updateOne('List', String(body.listId), {
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
  async moveCard(@Param('id') id: string, @Body() body: MoveCardDto): Promise<any> {
    try {
      const result = await this.crudService.updateOne('Card', id, { listId: body.listId });

      // Update cardsOrder of the list
      const { List: list } = await this.crudService.getOne('List', String(body.listId));
      const index = body.order - 1;
      await this.crudService.updateOne('List', String(body.listId), {
        cardsOrder: [
          ...list.cardsOrder.slice(0, index),
          Number(id),
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
  async updateCard(@Param('id') id: string, @Body() body: UpdateCardDto): Promise<any> {
    try {
      const result = await this.crudService.updateOne('Card', id, body);
      return result;
    } catch (error) {
      throw error;
    }
  }

  @Delete(':id') //
  @UseGuards(CardGuard)
  async deleteCard(@Param('id') id: string): Promise<any> {
    try {
      const result = await this.crudService.deleteOne('Card', id);
      return result;
    } catch (error) {
      throw error;
    }
  }

  @Get('my-cards/:boardId') 
  @UseGuards(BoardGuard)
  getMyAssignedCards(@GetUser() user: User, @Param("boardId", ParseIntPipe) boardId: number): any {
    return this.cardsService.getMyAssignedCards(user.id, boardId);
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
    return this.cardsService.assignMemberToCard(assigner.id, assigner.name, body.cardId, body.assigneeId);
  }
}
