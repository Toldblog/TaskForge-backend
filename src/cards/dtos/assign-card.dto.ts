import { IsNotEmpty, IsNumber } from 'class-validator';

export class AssignCardDto {
    @IsNotEmpty()
    @IsNumber()
    assigneeId: number;

    @IsNotEmpty()
    @IsNumber()
    cardId: number;
}
