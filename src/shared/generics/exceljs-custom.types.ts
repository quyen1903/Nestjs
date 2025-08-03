import * as ExcelJS from 'exceljs';

export type CustomExcelJsHeader = {
  key?: string;
  name: string;
  startCell?: string;
  width?: number;
  isHeader?: boolean;
  endCell?: string;
  outlineLevel?: number;
};

export type CustomHeaderMergeCell = {
  worksheet: ExcelJS.Worksheet;
  headers: CustomExcelJsHeader[];
  offset?: number;
  height?: number;
  rowNo?: number;
};

export type BorderCell = {
  style: ExcelJS.BorderStyle;
  color: ExcelJS.Color;
};

export type CustomCell = {
  worksheet: ExcelJS.Worksheet;
  field: string;
};

export type CustomExcelJsRowProperties<T> = {
  value: T | null | undefined;
  style?: Partial<ExcelJS.Style>;
};

export type CustomAddRow<T> = {
  [key: string]: CustomExcelJsRowProperties<T> | null | undefined;
};

export type CustomHeaderStyle = {
  worksheet: ExcelJS.Worksheet;
  rows: number;
};
