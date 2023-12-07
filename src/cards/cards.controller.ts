import {
  Controller,
  UseInterceptors,
  UseGuards,
  Post,
  Param,
  ParseIntPipe
} from '@nestjs/common';
import { CardsService } from './cards.service';
import { JwtAuthGuard } from 'src/auth/guards';
import { RolesGuard } from 'src/common/guards';
import { ResponseInterceptor } from 'src/common/interceptors';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { User } from '@prisma/client';

@Controller('cards')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(ResponseInterceptor)
export class CardsController {
  constructor(private cardsService: CardsService) { }

  @Post(':cardId/assign/:userId')
  assignMemberToCard(
    @GetUser() assigner: User,
    @Param('cardId', ParseIntPipe) cardId: number,
    @Param('userId', ParseIntPipe) userId: number
  ): any {
    return this.cardsService.assignMemberToCard(assigner.id, assigner.name, cardId, userId);
  }
}
