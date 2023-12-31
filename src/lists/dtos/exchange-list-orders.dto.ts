import { IsNotEmpty, IsNumber } from 'class-validator';

export class ExchangeListOrdersDto {
    @IsNotEmpty()
    @IsNumber()
    boardId: number;

    @IsNotEmpty()
    @IsNumber()
    listId: number;

    @IsNotEmpty()
    @IsNumber()
    newIndex: number;
}
