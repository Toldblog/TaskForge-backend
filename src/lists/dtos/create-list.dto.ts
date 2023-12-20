import { IsNotEmpty, IsNumber, IsString, MaxLength } from 'class-validator';

export class CreateListDto {
    @IsNotEmpty()
    @IsString()
    @MaxLength(20)
    name: string;

    @IsNotEmpty()
    @IsNumber()
    boardId: number;
}
