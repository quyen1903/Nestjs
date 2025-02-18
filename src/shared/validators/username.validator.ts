import { IsLowercase, IsNotEmpty, IsString, Length, Matches, ValidationOptions } from 'class-validator';

export function UsernameValidator(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    IsString(validationOptions)(object, propertyName);
    Length(1, 20, { message: 'username should be between 1 and 20 characters' })(object, propertyName);
    Matches(/^[a-z][a-z0-9]{0,19}$/, {
      message: 'username should start with a lowercase English letter and can contain lowercase letters and numbers only',
    })(object, propertyName);
    IsLowercase({ message: 'username should be in lowercase' })(object, propertyName);
    IsNotEmpty({ message: 'username is required' })(object, propertyName);
  };
}
