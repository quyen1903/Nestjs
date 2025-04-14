import { HttpException, HttpStatus, Injectable, PipeTransform } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';

@Injectable()
export class ParseArrayPipe implements PipeTransform<any> {
  constructor(private readonly type?: any) {}

  async transform(value: any, metadata: any) {
    if (!Array.isArray(value)) {
      throw new HttpException('Invalid input', HttpStatus.BAD_REQUEST);
    }

    const { metatype } = metadata;
    const parsedArray = [];

    for (const item of value) {
      const object = plainToClass(this.type || metatype, item);
      const errors = await validate(object);

      if (errors.length > 0) {
        const message = errors.map((error) => Object.values(error.constraints)).join(', ');
        throw new HttpException(message, HttpStatus.BAD_REQUEST);
      }

      parsedArray.push(object);
    }

    return parsedArray;
  }
}
