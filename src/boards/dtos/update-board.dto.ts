import {
    IsString,
    IsOptional,
    MaxLength,
} from 'class-validator';

export class UpdateBoardDto {
    @IsOptional()
    @IsString()
    @MaxLength(50)
    name: string;

    @IsOptional()
    @IsString()
    background: string;
    
    @IsOptional()
    visibility: boolean;

    @IsOptional()
    closed: boolean;
}
