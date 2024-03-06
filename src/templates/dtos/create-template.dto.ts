import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateTemplateDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsString()
    description: string;

    @IsNotEmpty()
    @IsString()
    type: string;

    @IsOptional()
    @IsString()
    defaultList: string;

    defaultBackground: any;
}
