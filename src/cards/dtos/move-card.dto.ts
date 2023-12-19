import { IsNotEmpty, IsNumber } from 'class-validator';

export class MoveCardDto {
    @IsNotEmpty()
    @IsNumber()
    listId: number;

    @IsNotEmpty()
    @IsNumber()
    order: number;
}
