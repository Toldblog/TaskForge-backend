import { IsNotEmpty, IsNumber, IsString, MaxLength } from 'class-validator';
export class CreateCardDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(20)
  title: string;

  @IsNotEmpty()
  @IsNumber()
  listId: number;
}
