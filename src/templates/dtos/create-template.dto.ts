import { IsArray, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { TemplateType } from "./template-type.enum";

export class CreateTemplateDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsString()
    description: string;

    @IsNotEmpty()
    @IsString()
    type: TemplateType;

    @IsOptional()
    @IsArray()
    defaultList: string[];

    @IsNotEmpty()
    defaultBackground: any;
}
