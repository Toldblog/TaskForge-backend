import { IsArray, IsOptional, IsString } from "class-validator";
import { TemplateType } from "./template-type.enum";

export class UpdateTemplateDto {
    @IsOptional()
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    description: string;

    @IsOptional()
    @IsString()
    type: TemplateType;

    @IsOptional()
    @IsArray()
    defaultList: string[];

    @IsOptional()
    defaultBackground: any;
}
