import { IsNotEmpty, IsNumber } from 'class-validator';

export class ExchangeListOrdersDto {
    @IsNotEmpty()
    @IsNumber()
    boardId: number;

    @IsNotEmpty()
    @IsNumber()
    firstListId: number;

    @IsNotEmpty()
    @IsNumber()
    secondListId: number;
}
