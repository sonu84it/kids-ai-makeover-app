import json
import mimetypes
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any
from uuid import uuid4

from google.cloud import storage

from app.config import Settings
from app.models.schemas import JobRecord


def build_source_object_path(job_id: str) -> str:
    return f"uploads/{job_id}/source.jpg"


def build_result_object_path(job_id: str) -> str:
    return f"results/{job_id}/final.png"


def build_job_object_path(job_id: str) -> str:
    return f"jobs/{job_id}.json"


class StorageService:
    def __init__(self, settings: Settings):
        self.settings = settings
        self._client = storage.Client(project=settings.google_cloud_project) if settings.use_gcs else None

    def new_job_id(self) -> str:
        return uuid4().hex

    def ensure_local_dirs(self) -> None:
        base = self.settings.local_data_dir
        for folder in ("uploads", "results", "jobs"):
            (base / folder).mkdir(parents=True, exist_ok=True)

    def _local_path(self, object_path: str) -> Path:
        self.ensure_local_dirs()
        return self.settings.local_data_dir / object_path

    def write_job(self, job: JobRecord) -> JobRecord:
        payload = job.model_dump(mode="json")
        object_path = build_job_object_path(job.job_id)
        if self.settings.use_gcs:
            blob = self._client.bucket(self.settings.effective_result_bucket).blob(object_path)
            blob.upload_from_string(json.dumps(payload), content_type="application/json")
        else:
            destination = self._local_path(object_path)
            destination.parent.mkdir(parents=True, exist_ok=True)
            destination.write_text(json.dumps(payload, indent=2), encoding="utf-8")
        return job

    def read_job(self, job_id: str) -> JobRecord | None:
        object_path = build_job_object_path(job_id)
        if self.settings.use_gcs:
            blob = self._client.bucket(self.settings.effective_result_bucket).blob(object_path)
            if not blob.exists():
                return None
            data = json.loads(blob.download_as_bytes())
        else:
            source = self._local_path(object_path)
            if not source.exists():
                return None
            data = json.loads(source.read_text(encoding="utf-8"))
        return JobRecord.model_validate(data)

    def create_signed_upload(self, job_id: str, content_type: str, base_url: str) -> dict[str, Any]:
        object_path = build_source_object_path(job_id)
        if self.settings.use_gcs:
            bucket = self._client.bucket(self.settings.upload_bucket)
            blob = bucket.blob(object_path)
            upload_url = blob.generate_signed_url(
                version="v4",
                expiration=timedelta(seconds=self.settings.signed_url_expiry_seconds),
                method="PUT",
                content_type=content_type,
            )
        else:
            upload_url = f"{base_url.rstrip('/')}/v1/uploads/mock/{job_id}/source"
        return {
            "upload_url": upload_url,
            "object_path": object_path,
            "expires_in_seconds": self.settings.signed_url_expiry_seconds,
        }

    def save_local_upload(self, object_path: str, data: bytes) -> None:
        destination = self._local_path(object_path)
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_bytes(data)

    def read_bytes(self, bucket_name: str, object_path: str) -> bytes:
        if self.settings.use_gcs:
            blob = self._client.bucket(bucket_name).blob(object_path)
            return blob.download_as_bytes()
        return self._local_path(object_path).read_bytes()

    def upload_result(self, job_id: str, data: bytes, content_type: str = "image/png") -> str:
        object_path = build_result_object_path(job_id)
        if self.settings.use_gcs:
            blob = self._client.bucket(self.settings.effective_result_bucket).blob(object_path)
            blob.upload_from_string(data, content_type=content_type)
        else:
            destination = self._local_path(object_path)
            destination.parent.mkdir(parents=True, exist_ok=True)
            destination.write_bytes(data)
        return object_path

    def delete_job_assets(self, job_id: str) -> None:
        for object_path, bucket_name in (
            (build_source_object_path(job_id), self.settings.upload_bucket or ""),
            (build_result_object_path(job_id), self.settings.effective_result_bucket or ""),
            (build_job_object_path(job_id), self.settings.effective_result_bucket or ""),
        ):
            if self.settings.use_gcs:
                bucket = self._client.bucket(bucket_name)
                blob = bucket.blob(object_path)
                if blob.exists():
                    blob.delete()
            else:
                file_path = self._local_path(object_path)
                if file_path.exists():
                    file_path.unlink()

    def mark_source_uploaded(self, job_id: str) -> None:
        job = self.read_job(job_id)
        if not job:
            return
        job.upload_completed = True
        job.updated_at = datetime.now(UTC)
        self.write_job(job)

    def job_asset_url(self, object_path: str | None, base_url: str) -> str | None:
        if not object_path:
            return None
        if self.settings.use_gcs:
            bucket_name = self.settings.upload_bucket if object_path.startswith("uploads/") else self.settings.effective_result_bucket
            blob = self._client.bucket(bucket_name).blob(object_path)
            content_type, _ = mimetypes.guess_type(object_path)
            return blob.generate_signed_url(
                version="v4",
                expiration=timedelta(seconds=self.settings.job_url_expiry_seconds),
                method="GET",
                response_type=content_type or "application/octet-stream",
            )
        return f"{base_url.rstrip('/')}/v1/assets/{object_path}"
