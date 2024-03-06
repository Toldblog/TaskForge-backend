import { Type } from 'class-transformer';
import { IsBoolean, IsDate, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateCardDto {
    @IsOptional()
    @IsString()
    @MaxLength(20)
    title: string;

    @IsOptional()
    @IsString()
    description: string;

    @IsOptional()
    @IsBoolean()
    active: boolean;

    @IsOptional()
    @IsDate()
    @Type(() => Date)
    dueDate: Date;

    @IsOptional()
    @IsDate()
    @Type(() => Date)
    reminderDate: Date;
}
