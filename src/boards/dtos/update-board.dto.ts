import {
    IsString,
    IsOptional,
    MaxLength,
} from 'class-validator';

export class UpdateBoardDto {
    @IsOptional()
    @IsString()
    @MaxLength(20)
    name: string;

    @IsOptional()
    @IsString()
    background: string;
    
    @IsOptional()
    visibility: boolean;

    @IsOptional()
    closed: boolean;
}
