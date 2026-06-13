import { Nil } from '../generics/type.helper';

export const addCreationTimestamps = (obj: Nil<any>) => {
  return {
    ...obj,
    createdAt: new Date().valueOf(),
    updatedAt: new Date().valueOf(),
  };
};

export const addUpdationTimestamps = (obj: Nil<any>) => {
  return {
    ...obj,
    updatedAt: new Date().valueOf(),
  };
};
