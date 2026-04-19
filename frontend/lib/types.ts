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
