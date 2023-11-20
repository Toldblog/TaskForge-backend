import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'passwordMatch', async: false })
export class PasswordMatch implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const { object } = args;

    return value === object['password'];
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} must match the password field`;
  }
}
