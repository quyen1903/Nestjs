// import { HttpException, HttpStatus, Injectable, PipeTransform } from '@nestjs/common';
// import { instanceToPlain, plainToInstance } from 'class-transformer';
// import { ValidationError, validate, validateOrReject } from 'class-validator';
// @Injectable()
// export class ValidationPipe implements PipeTransform<any> {
//   async transform(value: any, metadata: any) {
//     const { metatype } = metadata;
//     if (!metatype || !this.toValidate(metatype)) {
//       return value;
//     }

//     try {
//       const object = plainToInstance(metatype, value);
//       await validateOrReject(object);

//       await this.validateNestedDTOs(object);

//       const plainObject = instanceToPlain(object, { excludeExtraneousValues: false });
//       return plainObject;
//     } catch (errors) {
//       if (errors instanceof Array && errors.every((error) => error instanceof ValidationError)) {
//         // const message = errors.map((error: ValidationError) => Object.values(error.constraints)).join(', ');
//         const message = errors.map((error: ValidationError) => ({
//           name: error.property,
//           errors: Object.values(error.constraints),
//         }));

//         throw new HttpException(
//           Object.values(message).reduce((prev, cur) => {
//             return {
//               ...prev,
//               [cur.name]: cur.errors,
//             };
//           }, {}),
//           HttpStatus.UNPROCESSABLE_ENTITY,
//         );
//       } else {
//         throw new HttpException('Validation failed.', HttpStatus.BAD_REQUEST);
//       }
//     }
//   }

//   private async validateNestedDTOs(object: any) {
//     const properties = Object.getOwnPropertyNames(object);
//     for (const property of properties) {
//       const propertyValue = object[property];
//       if (propertyValue && typeof propertyValue === 'object' && !Array.isArray(propertyValue)) {
//         const nestedMetatype = (Reflect as any).getMetadata('design:type', object, property);
//         if (this.toValidate(nestedMetatype)) {
//           await validate(propertyValue).then((errors) => {
//             if (errors.length > 0) {
//               throw errors;
//             }
//           });
//           await this.validateNestedDTOs(propertyValue);
//         }
//       }
//     }
//   }

//   private toValidate(metaType: any): boolean {
//     const types: any[] = [String, Boolean, Number, Array, Object];
//     return !types.includes(metaType);
//   }
// }
