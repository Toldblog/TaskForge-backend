import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CardsService } from './cards.service';
import { Card, User } from '@prisma/client';
import { GetCardsFilterDto } from './dtos/get-cards-filter.dto';
import { CreateCardDto } from './dtos/create-card.dto';
import { UpdateCardStatusDto } from './dtos/update-card-status.dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'src/auth/decorators/get-user.decorator';

@Controller('cards')
@UseGuards(AuthGuard())
export class CardsController {
  constructor(private cardsService: CardsService) {}

  @Get()
  getCards(
    @Query() filterDto: GetCardsFilterDto,
    @GetUser() user: User,
  ): Promise<Card[]> {
    return this.cardsService.getCards(filterDto, user);
  }

  @Get('/:id')
  getCardById(@Param('id') id: string, @GetUser() user: User): Promise<Card> {
    return this.cardsService.getCardById(id, user);
  }

  @Post()
  createCard(
    @Body() createCardDto: CreateCardDto,
    @GetUser() user: User,
  ): Promise<void> {
    return this.cardsService.createCard(createCardDto, user);
  }

  //   @Post('/create-Cards')
  //   createCards(
  //     @Body() createCardsDto: CreateCardDto[],
  //     // @GetUser() user: User,
  //   ): Promise<Card[]> {
  //     return this.cardsService.createCards(createCardsDto);
  //   }

  @Delete('/:id')
  deleteCardById(
    @Param('id') id: string,
    @GetUser() user: User,
  ): Promise<void> {
    return this.cardsService.deleteCardById(id, user);
  }

  @Patch('/:id')
  updateCardStatus(
    @Param('id') id: string,
    @Body() updateCardStatusDto: UpdateCardStatusDto,
    @GetUser() user: User,
  ): Promise<void> {
    const { status } = updateCardStatusDto;
    return this.cardsService.updateCardStatus(id, status, user);
  }
}
