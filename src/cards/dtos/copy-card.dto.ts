import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class CopyCardDto {
    @IsNotEmpty()
    @IsBoolean()
    keepMembers: boolean;

    @IsNotEmpty()
    @IsBoolean()
    keepAttachments: boolean;

    @IsNotEmpty()
    @IsNumber()
    listId: number;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    title: string;
}
