import {
    IsOptional,
    IsString,
    MaxLength,
    MinLength,
} from 'class-validator';

export class UpdateWorkspaceDto {
    @IsOptional()
    @IsString()
    @MinLength(4)
    @MaxLength(20)
    name: string;

    @IsOptional()
    @IsString()
    description: string;
}
