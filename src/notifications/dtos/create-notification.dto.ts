import {
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
} from 'class-validator';

export class CreateNotificationDto {
    @IsNotEmpty()
    @IsString()
    type: string;
    
    @IsNotEmpty()
    @IsNumber()
    receiverId: number;
    
    @IsOptional()
    @IsNumber()
    workspaceId: number;

    @IsOptional()
    @IsNumber()
    boardId: number;

    @IsOptional()
    @IsNumber()
    cardId: number;
}
