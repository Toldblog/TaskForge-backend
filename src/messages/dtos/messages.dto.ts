import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class MessageDto {
  @IsNotEmpty()
  @IsString()
  content: string;

  @IsNotEmpty()
  @IsNumber()
  boardId: number;
}
