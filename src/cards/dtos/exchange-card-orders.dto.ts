import { IsNotEmpty, IsNumber } from 'class-validator';

export class ExchangeCardOrdersDto {
    @IsNotEmpty()
    @IsNumber()
    listId: number;

    @IsNotEmpty()
    @IsNumber()
    firstCardId: number;

    @IsNotEmpty()
    @IsNumber()
    secondCardId: number;
}
