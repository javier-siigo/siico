export type NotasCreditoRunStatus =
  | "idle"
  | "uploading"
  | "processing"
  | "done"
  | "error";

export interface NotasCreditoRun {
  id: string;
  status: NotasCreditoRunStatus;
  sourceFilename: string;
  sourceSize: number;
  startedAt: number;
  finishedAt?: number;
  resultFilename?: string;
  resultSize?: number;
  resultBlob?: Blob;
  resultContentType?: string;
  error?: string;
}
