import {
    ValidatorConstraint,
    ValidatorConstraintInterface,
    ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'passwordMatch', async: false })
export class NewPasswordMatch implements ValidatorConstraintInterface {
    validate(value: any, args: ValidationArguments): boolean {
        const { object } = args;

        return value === object['newPassword'];
    }

    defaultMessage(args: ValidationArguments) {
        return `${args.property} must match the new password field`;
    }
}
