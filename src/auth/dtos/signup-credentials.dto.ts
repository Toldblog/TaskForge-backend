import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  Validate,
} from 'class-validator';
import { PasswordMatch } from '../validators';

export class SignUpCredentialsDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(4)
  @MaxLength(20)
  username: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @IsString()
  @MinLength(4)
  @MaxLength(20)
  name: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @MaxLength(20)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password is too weak',
  })
  password: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(20)
  @Validate(PasswordMatch)
  passwordConfirm: string;
}
// Passwords will contain at least 1 upper case letter
// Passwords will contain at least 1 lower case letter
// Passwords will contain at least 1 number or special character
// There is no length validation (min, max) in this regex!
