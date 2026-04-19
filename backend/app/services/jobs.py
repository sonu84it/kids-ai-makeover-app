import logging
from datetime import UTC, datetime

from app.config import Settings
from app.models.schemas import CreateMakeoverRequest, JobRecord, JobResponse, WorkerProcessResult
from app.services.policy import build_instruction_text
from app.services.preprocess import PreprocessError, preprocess_image
from app.services.storage import (
    StorageService,
    build_result_object_path,
    build_source_object_path,
)
from app.services.vertex_imagen import VertexImagenError, VertexImagenService

logger = logging.getLogger(__name__)


class JobService:
    def __init__(self, settings: Settings, storage: StorageService, imagen: VertexImagenService):
        self.settings = settings
        self.storage = storage
        self.imagen = imagen

    def create_job(self) -> JobRecord:
        now = datetime.now(UTC)
        job_id = self.storage.new_job_id()
        job = JobRecord(
            job_id=job_id,
            source_path=build_source_object_path(job_id),
            created_at=now,
            updated_at=now,
        )
        self.storage.write_job(job)
        return job

    def create_signed_upload(self, content_type: str, base_url: str) -> tuple[JobRecord, dict]:
        job = self.create_job()
        job.source_content_type = content_type
        self.storage.write_job(job)
        signed = self.storage.create_signed_upload(job.job_id, content_type, base_url)
        return job, signed

    def mark_makeover_ready(self, payload: CreateMakeoverRequest) -> JobRecord:
        job = self.storage.read_job(payload.job_id)
        if not job or job.deleted:
            raise ValueError("job_not_found")
        job.preset_id = payload.preset_id
        job.ready_for_processing = True
        job.updated_at = datetime.now(UTC)
        self.storage.write_job(job)
        return job

    def get_job_response(self, job_id: str, base_url: str) -> JobResponse | None:
        job = self.storage.read_job(job_id)
        if not job:
            return None
        return JobResponse(
            job_id=job.job_id,
            status=job.status,
            source_path=job.source_path,
            result_path=job.result_path,
            error_code=job.error_code,
            preset_id=job.preset_id,
            source_download_url=self.storage.job_asset_url(job.source_path, base_url) if job.upload_completed else None,
            result_download_url=self.storage.job_asset_url(job.result_path, base_url) if job.result_path else None,
        )

    def delete_job(self, job_id: str) -> JobRecord | None:
        job = self.storage.read_job(job_id)
        if not job:
            return None
        self.storage.delete_job_assets(job_id)
        job.deleted = True
        job.status = "deleted"
        job.updated_at = datetime.now(UTC)
        self.storage.write_job(job)
        return job

    def maybe_process_ready_job(self, job_id: str) -> WorkerProcessResult | None:
        job = self.storage.read_job(job_id)
        if not job or job.deleted or not job.ready_for_processing or not job.upload_completed:
            return None
        return self.process_job(job_id)

    def process_job(self, job_id: str) -> WorkerProcessResult:
        job = self.storage.read_job(job_id)
        if not job:
            raise ValueError("job_not_found")
        if not job.preset_id:
            raise ValueError("job_not_ready")

        job.status = "processing"
        job.updated_at = datetime.now(UTC)
        job.error_code = None
        self.storage.write_job(job)

        try:
            image_bytes = self.storage.read_bytes(self.settings.upload_bucket, job.source_path)
            preprocess_result = preprocess_image(image_bytes, job.source_content_type, self.settings)
            instruction = build_instruction_text(job.preset_id)
            result_bytes = self.imagen.edit_image(
                preprocess_result.image_bytes,
                instruction,
                preprocess_result.mask_bytes,
            )
            result_path = self.storage.upload_result(job.job_id, result_bytes)
            job.result_path = result_path
            job.status = "completed"
            job.updated_at = datetime.now(UTC)
            self.storage.write_job(job)
            logger.info("job_completed", extra={"job_id": job_id, "result_path": result_path})
            return WorkerProcessResult(job_id=job.job_id, status=job.status, result_path=result_path)
        except PreprocessError as exc:
            error_code = exc.code
        except VertexImagenError as exc:
            error_code = exc.code
        except Exception:
            error_code = "processing_failed"
            logger.exception("job_processing_failed", extra={"job_id": job_id})

        job.status = "failed"
        job.error_code = error_code
        job.updated_at = datetime.now(UTC)
        self.storage.write_job(job)
        return WorkerProcessResult(job_id=job.job_id, status=job.status, error_code=error_code)
