import { IsNotEmpty, IsNumber } from 'class-validator';

export class MoveCardAnotherListDto {
    @IsNotEmpty()
    @IsNumber()
    oldListId: number;

    @IsNotEmpty()
    @IsNumber()
    newListId: number;

    @IsNotEmpty()
    @IsNumber()
    newIndex: number;
}
