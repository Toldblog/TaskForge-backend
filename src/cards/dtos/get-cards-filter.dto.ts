import { IsEnum, IsOptional, IsString } from 'class-validator';
import { card_status } from '@prisma/client';

export class GetCardsFilterDto {
  @IsOptional()
  @IsEnum(card_status)
  status?: card_status;

  @IsOptional()
  @IsString()
  search?: string;
}
