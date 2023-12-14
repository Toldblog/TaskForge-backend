import {
    IsNotEmpty, IsNumber,
} from 'class-validator';

export class ShareBoardDto {
    @IsNotEmpty()
    @IsNumber()
    userId: number;

    @IsNotEmpty()
    @IsNumber()
    boardId: number;
}
