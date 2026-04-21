from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


PresetId = Literal["superhero", "astronaut", "royal", "jungle", "festive"]
JobStatus = Literal["pending", "processing", "completed", "failed", "deleted"]


class UploadSignRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    filename: str = Field(min_length=1, max_length=255)
    content_type: str = Field(default="image/jpeg", alias="contentType", serialization_alias="contentType")
    size_bytes: int | None = Field(default=None, ge=1, alias="sizeBytes", serialization_alias="sizeBytes")


class UploadSignResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    job_id: str = Field(alias="jobId", serialization_alias="jobId")
    upload_url: str = Field(alias="uploadUrl", serialization_alias="uploadUrl")
    object_path: str = Field(alias="objectPath", serialization_alias="objectPath")
    expires_in_seconds: int = Field(alias="expiry", serialization_alias="expiry")


class CreateMakeoverRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    job_id: str = Field(min_length=8, max_length=64, alias="jobId", serialization_alias="jobId")
    preset_id: PresetId = Field(alias="presetId", serialization_alias="presetId")


class JobResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    job_id: str = Field(alias="jobId", serialization_alias="jobId")
    status: JobStatus
    source_path: str = Field(alias="sourcePath", serialization_alias="sourcePath")
    result_path: str | None = Field(default=None, alias="resultPath", serialization_alias="resultPath")
    error_code: str | None = Field(default=None, alias="errorCode", serialization_alias="errorCode")
    preset_id: PresetId | None = Field(default=None, alias="presetId", serialization_alias="presetId")
    source_download_url: str | None = Field(default=None, alias="sourceDownloadUrl", serialization_alias="sourceDownloadUrl")
    result_download_url: str | None = Field(default=None, alias="resultDownloadUrl", serialization_alias="resultDownloadUrl")


class JobRecord(BaseModel):
    job_id: str
    status: JobStatus = "pending"
    source_path: str
    source_content_type: str = "image/jpeg"
    result_path: str | None = None
    error_code: str | None = None
    preset_id: PresetId | None = None
    upload_completed: bool = False
    ready_for_processing: bool = False
    deleted: bool = False
    created_at: datetime
    updated_at: datetime


class WorkerProcessResult(BaseModel):
    job_id: str
    status: JobStatus
    result_path: str | None = None
    error_code: str | None = None


class ImageAssetQueryRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    prefix: str | None = Field(default=None, max_length=1024)
    limit: int = Field(default=25, ge=1, le=200)
    include_signed_urls: bool = Field(default=False, alias="includeSignedUrls", serialization_alias="includeSignedUrls")


class ImageAssetRecord(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    uri: str
    bucket_name: str = Field(alias="bucketName", serialization_alias="bucketName")
    object_path: str = Field(alias="objectPath", serialization_alias="objectPath")
    content_type: str | None = Field(default=None, alias="contentType", serialization_alias="contentType")
    size: int | None = None
    generation: int | None = None
    signed_url: str | None = Field(default=None, alias="signedUrl", serialization_alias="signedUrl")


class ImageAssetQueryResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    sql: str
    rows: list[ImageAssetRecord]
