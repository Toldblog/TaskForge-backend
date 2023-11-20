// import { Injectable, NotFoundException } from '@nestjs/common';
// import { CreateCardDto } from './dtos/create-card.dto';
// import { GetCardsFilterDto } from './dtos/get-cards-filter.dto';
// import { card_status, Card, User } from '@prisma/client';
// import { PrismaService } from 'src/prisma/prisma.service';

// @Injectable()
// export class CardsService {
//   constructor(private prismaService: PrismaService) {}

//   async getCards(filterDto: GetCardsFilterDto, user: User): Promise<Card[]> {
//     const { status, search } = filterDto;
//     const cards = await this.prismaService.card.findMany({
//       where: {
//         user: { id: user.id },
//         status: status ? { equals: status } : undefined,
//         OR: search
//           ? [
//               { title: { contains: search, mode: 'insensitive' } },
//               { description: { contains: search, mode: 'insensitive' } },
//             ]
//           : undefined,
//       },
//     });

//     return cards;
//   }

//   async getCardById(id: string, user: User): Promise<Card> {
//     const found = await this.prismaService.card.findUnique({
//       where: {
//         id,
//         userId: user.id,
//       },
//     });

//     if (!found) {
//       throw new NotFoundException(`Card with ID "${id}" not found`);
//     }

//     return found;
//   }

//   async createCard(createCardDto: CreateCardDto, user: User): Promise<void> {
//     const { title, description } = createCardDto;

//     await this.prismaService.card.create({
//       data: {
//         title,
//         description,
//         userId: user.id,
//       },
//     });
//   }

//   // Uncomment if needed
//   // async createCards(
//   //   createCardsDto: CreateCardDto[],
//   //   user: User,
//   // ): Promise<Card[]> {
//   //   const cards: Card[] = [];

//   //   for (const cardDto of createCardsDto) {
//   //     const card = await this.createCard(cardDto, user);
//   //     cards.push(card);
//   //   }

//   //   return cards;
//   // }

//   async deleteCardById(id: string, user: User): Promise<void> {
//     const result = await this.prismaService.card.delete({
//       where: {
//         id,
//         userId: user.id,
//       },
//     });
//     if (!result) {
//       throw new NotFoundException(`Card with ID "${id}" not found`);
//     }
//   }

//   async updateCardStatus(
//     id: string,
//     status: card_status,
//     user: User,
//   ): Promise<void> {
//     await this.prismaService.card.updateMany({
//       where: {
//         id,
//         userId: user.id,
//       },
//       data: { status },
//     });
//   }
// }
