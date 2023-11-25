import { IsNotEmpty, IsString, Matches, MaxLength, MinLength, Validate } from "class-validator";
import { PasswordMatch } from "../validators/password-match.validator";

export class ResetPasswordDto {
    @IsNotEmpty()
    @IsString()
    @MinLength(8)
    @MaxLength(20)
    @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
        message: 'Password is too weak',
    })
    password: string;

    @IsNotEmpty()
    @IsString()
    @Validate(PasswordMatch)
    passwordConfirm: string;
}