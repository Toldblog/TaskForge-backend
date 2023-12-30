import { IsNotEmpty, IsNumber } from 'class-validator';

export class MoveCardInListDto {
    @IsNotEmpty()
    @IsNumber()
    listId: number;

    @IsNotEmpty()
    @IsNumber()
    cardId: number;

    @IsNotEmpty()
    @IsNumber()
    newIndex: number;
}
