export type PresetId = "superhero" | "astronaut" | "royal" | "jungle" | "festive";

export type JobStatus = "pending" | "processing" | "completed" | "failed" | "deleted";

export interface UploadSignResponse {
  jobId: string;
  uploadUrl: string;
  objectPath: string;
  expiry: number;
}

export interface JobResponse {
  jobId: string;
  status: JobStatus;
  sourcePath: string;
  resultPath: string | null;
  errorCode: string | null;
  presetId: PresetId | null;
  sourceDownloadUrl: string | null;
  resultDownloadUrl: string | null;
}

export interface AssetQueryRequest {
  prefix?: string;
  limit?: number;
  includeSignedUrls?: boolean;
}

export interface AssetRecord {
  uri: string;
  bucketName: string;
  objectPath: string;
  contentType: string | null;
  size: number | null;
  generation: number | null;
  signedUrl: string | null;
}

export interface AssetQueryResponse {
  sql: string;
  rows: AssetRecord[];
}
