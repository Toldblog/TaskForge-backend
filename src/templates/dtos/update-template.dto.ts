import { IsOptional, IsString } from "class-validator";

export class UpdateTemplateDto {
    @IsOptional()
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    description: string;

    @IsOptional()
    @IsString()
    type: string;

    @IsOptional()
    @IsString()
    defaultList: any;

    @IsOptional()
    defaultBackground: any;
}
