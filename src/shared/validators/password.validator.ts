import { IsString, Length, Matches } from 'class-validator';

export function PasswordValidator() {
  return function (object: object, propertyName: string) {
    IsString({ message: 'password must be a string' })(object, propertyName);
    Length(6, 20, { message: 'password should be between 6 and 20 characters' })(object, propertyName);
    Matches(/^(?=.*[a-zA-Z])(?=.*[0-9])[a-zA-Z0-9!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]*$/, {
      message: 'password should contain a combination of English letters and numbers with optional special characters',
      each: true,
    })(object, propertyName);
  };
}
