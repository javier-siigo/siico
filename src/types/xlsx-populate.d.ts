declare module "xlsx-populate" {
  interface XlsxCell {
    rowNumber(): number;
    columnNumber(): number;
    value(): unknown;
  }

  interface XlsxRange {
    startCell(): XlsxCell;
    endCell(): XlsxCell;
    cells(): XlsxCell[];
    style(style: object): XlsxRange;
  }

  interface XlsxRow {
    minUsedColumnNumber(): number;
    maxUsedColumnNumber(): number;
  }

  interface XlsxSheet {
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

  interface XlsxWorkbook {
    sheets(): XlsxSheet[];
    sheet(nameOrIndex: string | number): XlsxSheet | undefined;
    outputAsync(opts?: {
      type?: string;
      password?: string;
    }): Promise<ArrayBuffer | Buffer>;
  }

  interface XlsxPopulateStatic {
    fromDataAsync(
      data: Buffer | ArrayBuffer | Uint8Array | string,
      opts?: object,
    ): Promise<XlsxWorkbook>;
    fromFileAsync(path: string, opts?: object): Promise<XlsxWorkbook>;
    fromBlankAsync(): Promise<XlsxWorkbook>;
  }

  const XlsxPopulate: XlsxPopulateStatic;
  export = XlsxPopulate;
}
