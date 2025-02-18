import { CustomExcelJsRowProperties } from './exceljs-custom.types';

export type AtLeast<T, K extends keyof T> = Partial<T> & Pick<T, K>;
export type RequiredFields<T> = {
  [P in keyof T]-?: RequiredFields<NonNullable<T[P]>>;
};
export type WithRequiredFields<Type, Key extends keyof Type> = Type & {
  [Property in Key]-?: NonNullable<Type[Property]>;
};

/* Nil */
export type Nil<T> = T | null | undefined;
export type NilFields<T> = {
  [K in keyof T]?: T[K] | null | undefined;
};
export type WithNilFields<T, Fields extends keyof T> = {
  [K in keyof T]: K extends Fields ? T[K] | null | undefined : T[K];
};
export type WithNonNilFields<T, Fields extends keyof T> = {
  [K in Fields]-?: T[K]; // Ensure the keys in Fields are non-nullable and required
} & {
  [K in Exclude<keyof T, Fields>]?: T[K] | null | undefined; // Make all other keys nullable and optional
};

/* Nullable */
export type Nullable<T> = T | null;
export type NullableFields<T> = {
  [K in keyof T]?: T[K] | null;
};
export type WithNullableFields<T, Fields extends keyof T> = {
  [K in keyof T]: K extends Fields ? T[K] | null : T[K];
};
export type WithNonNullableFields<T, Fields extends keyof T> = {
  [K in Fields]-?: T[K]; // Ensure the keys in Fields are non-nullable and required
} & {
  [K in Exclude<keyof T, Fields>]?: T[K] | null; // Make all other keys nullable and optional
};

/* Deep Nullable */
export type DeepNullableBy<T, Fields extends keyof T> = {
  [K in keyof T]?: K extends Fields ? DeepNullableBy<T[K], any> | null : T[K];
};
export type DeepNullable<T> = {
  [K in keyof T]: DeepNullable<T[K]> | null;
};

export type DeepPartialBy<T, Fields extends keyof T> = {
  [K in keyof T]?: K extends Fields ? DeepPartialBy<T[K], any> : T[K];
};
export type WithOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type ExcelSheetValue<T> = { [key in keyof T]: { name: string; width?: number } };

export type ExcelSheetExtendValue<T> = {
  [K in keyof T]: T[K] extends Array<infer E>
    ? {
        [P in keyof E as `${K & string}${Extract<P, number>}`]: {
          name: `${Extract<P, number>}`;
          width?: number;
          idx: number;
        };
      }
    : { name: string; width?: number; idx: number };
};

export type ExcelRowJustin<T> = {
  [K in keyof T]?: CustomExcelJsRowProperties<T[K]> | null | undefined;
};

export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};
