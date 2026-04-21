import { AssetQueryRequest, AssetQueryResponse, JobResponse, PresetId, UploadSignResponse } from "./types";

const API_BASE_URL = "/api";

export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const body = await response.json();
    const detail = body?.detail;
    const errorCode = typeof detail?.errorCode === "string" ? detail.errorCode : null;
    if (errorCode === "too_large") {
      return "This image is too large. Please choose one under 10MB.";
    }
    if (errorCode === "invalid_type") {
      return "This image format is not supported. Please use JPG, PNG, or WEBP.";
    }
    if (errorCode === "image_too_small") {
      return "This photo is too small. Please choose a clearer image.";
    }
    if (errorCode === "subject_not_clear") {
      return "Please use a clearer portrait or half-body child photo.";
    }
    if (errorCode === "job_not_found") {
      return "This upload session expired. Please start again.";
    }
  } catch {
    // Ignore non-JSON responses and fall back to a friendly default message.
  }
  return fallback;
}

function normalizeNetworkError(error: unknown, fallback: string): Error {
  if (error instanceof Error) {
    const message = error.message.trim();
    if (!message || message === "Failed to fetch" || message === "Load failed") {
      return new Error(fallback);
    }
    return error;
  }
  return new Error(fallback);
}

export async function signUpload(file: File): Promise<UploadSignResponse> {
  try {
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
      throw new Error(await readErrorMessage(response, "Unable to start upload."));
    }
    return response.json();
  } catch (error) {
    throw normalizeNetworkError(error, "Unable to reach the upload service. Please try again.");
  }
}

export async function uploadFile(uploadUrl: string, file: File): Promise<void> {
  try {
    const response = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type || "image/jpeg"
      },
      body: file
    });
    if (!response.ok) {
      throw new Error("Upload failed. Please try a JPG, PNG, or WEBP image.");
    }
  } catch (error) {
    throw normalizeNetworkError(error, "Image upload failed in this browser. Please try JPG or PNG, or retry on desktop.");
  }
}

export async function createMakeover(jobId: string, presetId: PresetId): Promise<JobResponse> {
  try {
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
      throw new Error(await readErrorMessage(response, "Unable to queue makeover."));
    }
    return response.json();
  } catch (error) {
    throw normalizeNetworkError(error, "Unable to queue the makeover right now. Please try again.");
  }
}

export async function getJob(jobId: string): Promise<JobResponse> {
  try {
    const response = await fetch(apiUrl(`/v1/makeovers/${jobId}`), {
      cache: "no-store"
    });
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "Unable to load job."));
    }
    return response.json();
  } catch (error) {
    throw normalizeNetworkError(error, "Unable to load the latest job status.");
  }
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

export async function queryAssets(payload: AssetQueryRequest): Promise<AssetQueryResponse> {
  try {
    const response = await fetch(apiUrl("/v1/assets:query"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "Unable to query stored images."));
    }
    return response.json();
  } catch (error) {
    throw normalizeNetworkError(error, "Unable to query stored images right now.");
  }
}
