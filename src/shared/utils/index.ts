import _, { Object, pick } from 'lodash';
import { validate,ValidationError } from 'class-validator';
import { BadRequestException } from '@nestjs/common';
// export function DTOLogger(errors: ValidationError[]){
//     errors.forEach((error)=>{
//         console.log(`Property: ${error.property}`);
//         if(error.constraints){
//             Object.keys(error.constraints).forEach((key)=>{
//                 console.log(`- ${error.constraints![key]}`);
//                 throw new BadRequestError(`- ${error.constraints![key]}`)
//             })
//         }
//     })
// }
  
function collectValidationKeys(error: ValidationError): string[] {
    let keys: string[] = [];

    // Add the current property's key if it exists
    if (error.property) {
        keys.push(error.property);
    }

    // Check if the error has children
    if (error.children && error.children.length > 0) {
        for (const child of error.children) {
            // Recursively collect keys from children
            keys = keys.concat(collectValidationKeys(child));
        }
    }

    return keys;
}

// Modified validator function to handle validation and log errors
export async function validator(input: {}): Promise<void> {
    const errors = await validate(input);

    if (errors.length > 0) {
        // Collect all constraint keys from the validation errors
        const allKeys: string[] = errors.flatMap(error => collectValidationKeys(error));
        const uniqueKeys = Array.from(new Set(allKeys)); // Remove duplicates

        // Construct error message
        const errorMessage = `Validation errors on properties: ${uniqueKeys.join(', ')}`;
        console.log(`Validation error: ${errorMessage}`);
        throw new BadRequestException(errorMessage); // Throw an error with all constraint keys
    }
}
  

export const getInfoData = (field: string[],object: object)=>{
    return pick(object,field)
}

//['a','b'] => {a:1,b:1}
export const getSelectData = (select: string[])=>{
    return Object.fromEntries(select.map(element => [element,1]))
}

//['a','b'] => {a:0,b:0}
export const unGetSelectData = (select: string[])=>{
    return Object.fromEntries(select.map(element => [element,0]))
}
/**
 * Record<Keys, Type> 
 * construct an object type whose key are Keys and whose property value are Type
 * by default, key always string(Typescript) or symbol(Javascript)
 * here, we allows all type, but we remove all field has value null
 */
export const removeUndefinedObject = (object:Record<string,any>): Record<string,any> =>{
    Object.keys(object).forEach(key =>{
        if(object[key] == null){
            delete object[key]
        }
    })
    return object
}

/**
  example
  const nestedObject = {
    level1: {level2: {level3: {level4: {level5: {key: 'value'}}}}},anotherLevel1: {level2: {key2: 'value2'}
    }
    result
    {
        'level1.level2.level3.key4.key5.key': 'value',
        'anotherLevel1.key2': 'value2'
    }
    first we pass nestedObject, key is level1 and value is level2:{}, we wait result of next level as argument for this level   
    second we pass level1, key is level2 and value is level3:{}, response at this level is result of call to level2
    third we pass level2, key is level3 and value is level4:{}, response at this level is result of call to level3
    fourth we pass level3, key is level4 and value is level5:{}, response at this level is result of call to level4
    fifth we pass level 4, key is level5 and value is objecct {key: 'value'}, response at this level is result call to level5
    sixth we pass object, this time value is 'value' string, not an object. else statement is execute. final is { key: 'value' }
    { key: 'value' } is value of response call to level five, this code would be execute
    Object.keys(response).forEach(a =>{
        final[`${key}.${a}`] = response[a]
    })
    final{} will be update with value which come from level 5 call, then
    Object.keys(response).forEach(a =>{
        final[`${key}.${a}`] = response[a]
    })
    continue use value from level 4 call to update final{}
    so on utils it reach the end of level1.
    same thing in anotherLevel1 fields

    AFTER THIS LINE OF CODE
    return final
    IMMIDIATELY IT PASS THIS RETURN TO HERE
    const response = updateNestedObjectParser(object[key])
    NOT END OUR CODE
};
 */
export const flattenNestedObject =(object: Record<string, any>): Record<string, any> =>{
    if (!object) {
        return {};
    }
    const final: Record<string, any> = {}
    Object.keys(object).forEach(key =>{
        if(typeof object[key] === 'object' && !Array.isArray(object[key])){
            const response = flattenNestedObject(object[key])
            Object.keys(response).forEach(a =>{
                final[`${key}.${a}`] = response[a]
            })
        }else{
            final[key] = object[key]
        }
    })
    return final
}

export const flattenNestedArray = (array: Array<any>|undefined): Array<any> => {
    const result: Array<any> = [];

    array!.forEach(item => {
        if (Array.isArray(item)) {
            // Recursively flatten any nested arrays
            result.push(...flattenNestedArray(item));
        } else if (typeof item === 'object' && item !== null) {
            // If the item is an object, push it into the result
            result.push(item);
        } else {
            // If the item is not an object, just push it as is
            result.push(item);
        }
    });

    return result;
};