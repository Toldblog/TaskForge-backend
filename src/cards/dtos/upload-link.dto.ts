import { IsNotEmpty, IsString } from 'class-validator';

export class UploadLinkDto {
    @IsNotEmpty()
    @IsString()
    fileName: string;

    @IsNotEmpty()
    @IsString()
    url: string;
}
