import { IsNotEmpty, IsString, Matches, MaxLength, MinLength, Validate } from "class-validator";
import { NewPasswordMatch } from "../validators/new-password-match.validator";

export class GoogleAddPasswordDto {
    @IsNotEmpty()
    @IsString()
    @MinLength(8)
    @MaxLength(20)
    @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
        message: 'Password is too weak',
    })
    newPassword: string;

    @IsNotEmpty()
    @IsString()
    @Validate(NewPasswordMatch)
    newPasswordConfirm: string;
}