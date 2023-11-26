import { IsNotEmpty, IsString, Matches, MaxLength, MinLength, Validate } from "class-validator";
import { NewPasswordMatch } from "../validators";

export class UpdatePasswordDto {
    @IsNotEmpty()
    @IsString()
    currentPassword: string;

    @IsNotEmpty()
    @IsString()
    @MinLength(8)
    @MaxLength(20)
    @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
        message: 'New password is too weak',
    })
    newPassword: string;

    @IsString()
    @IsNotEmpty()
    @Validate(NewPasswordMatch)
    newPasswordConfirm: string;
}