import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;

export function normalizeIndianMobile(value: string): string {
  return value.replace(/\D/g, '').slice(-10);
}

export function isValidIndianMobile(value: string): boolean {
  return INDIAN_MOBILE_REGEX.test(normalizeIndianMobile(value));
}

@ValidatorConstraint({ name: 'isIndianMobile', async: false })
export class IsIndianMobileConstraint implements ValidatorConstraintInterface {
  validate(value: unknown) {
    if (value === undefined || value === null || value === '') return true;
    if (typeof value !== 'string') return false;
    return isValidIndianMobile(value);
  }

  defaultMessage() {
    return 'Must be a valid 10-digit India mobile number (starting with 6-9)';
  }
}

export function IsIndianMobile(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsIndianMobileConstraint,
    });
  };
}

export function IsIndianMobileRequired(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: {
        validate(value: unknown) {
          if (typeof value !== 'string') return false;
          return isValidIndianMobile(value);
        },
        defaultMessage() {
          return 'Must be a valid 10-digit India mobile number (starting with 6-9)';
        },
      },
    });
  };
}
