import { IsNotEmpty, IsNumber, IsString, MaxLength } from 'class-validator';
export class CreateCardDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  title: string;

  @IsNotEmpty()
  @IsNumber()
  listId: number;
}
