import {
    IsNotEmpty,
    IsString,
    MaxLength,
} from 'class-validator';

export class CreateBoardDto {
    @IsNotEmpty()
    @IsString()
    @MaxLength(20)
    name: string;

    @IsNotEmpty()
    workspaceId: number;

    @IsNotEmpty()
    templateId: number;

    @IsNotEmpty()
    visibility: boolean;
}
