import { JobResponse, PresetId, UploadSignResponse } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

export async function signUpload(file: File): Promise<UploadSignResponse> {
  const response = await fetch(apiUrl("/v1/uploads:sign"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type || "image/jpeg",
      sizeBytes: file.size
    })
  });
  if (!response.ok) {
    throw new Error("Unable to start upload.");
  }
  return response.json();
}

export async function uploadFile(uploadUrl: string, file: File): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type || "image/jpeg"
    },
    body: file
  });
  if (!response.ok) {
    throw new Error("Upload failed.");
  }
}

export async function createMakeover(jobId: string, presetId: PresetId): Promise<JobResponse> {
  const response = await fetch(apiUrl("/v1/makeovers"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      jobId,
      presetId
    })
  });
  if (!response.ok) {
    throw new Error("Unable to queue makeover.");
  }
  return response.json();
}

export async function getJob(jobId: string): Promise<JobResponse> {
  const response = await fetch(apiUrl(`/v1/makeovers/${jobId}`), {
    cache: "no-store"
  });
  if (!response.ok) {
    throw new Error("Unable to load job.");
  }
  return response.json();
}

export async function deleteJob(jobId: string): Promise<JobResponse> {
  const response = await fetch(apiUrl(`/v1/makeovers/${jobId}`), {
    method: "DELETE"
  });
  if (!response.ok) {
    throw new Error("Delete failed.");
  }
  return response.json();
}
