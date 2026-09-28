export interface XlsxCell {
  rowNumber(): number;
  columnNumber(): number;
  value(): unknown;
}

export interface XlsxRange {
  startCell(): XlsxCell;
  endCell(): XlsxCell;
  cells(): XlsxCell[];
  style(style: object): XlsxRange;
}

export interface XlsxRow {
  minUsedColumnNumber(): number;
  maxUsedColumnNumber(): number;
}

export interface XlsxSheet {
  name(): string;
  row(rowNumber: number): XlsxRow;
  cell(rowNumber: number, columnNumber: number): XlsxCell;
  usedRange(): XlsxRange | undefined;
  range(
    startRow: number,
    startColumn: number,
    endRow: number,
    endColumn: number,
  ): XlsxRange;
}

export interface XlsxWorkbook {
  sheets(): XlsxSheet[];
  sheet(nameOrIndex: string | number): XlsxSheet | undefined;
  outputAsync(opts?: {
    type?: string;
    password?: string;
  }): Promise<ArrayBuffer | Buffer>;
}
