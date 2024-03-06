import { IsOptional, IsString } from 'class-validator';

export class UpdateAttachmentDto {
    @IsOptional()
    @IsString()
    fileName: string;

    @IsOptional()
    @IsString()
    url: string;
}
