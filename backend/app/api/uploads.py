from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status

from app.config import Settings, get_settings
from app.models.schemas import UploadSignRequest, UploadSignResponse
from app.services.jobs import JobService
from app.services.storage import StorageService, build_source_object_path
from app.services.vertex_imagen import VertexImagenService

router = APIRouter(prefix="/v1", tags=["uploads"])


def get_job_service(settings: Settings = Depends(get_settings)) -> JobService:
    storage = StorageService(settings)
    return JobService(settings, storage, VertexImagenService(settings))


@router.post("/uploads:sign", response_model=UploadSignResponse)
def sign_upload_url(
    payload: UploadSignRequest,
    request: Request,
    service: JobService = Depends(get_job_service),
) -> UploadSignResponse:
    if payload.size_bytes and payload.size_bytes > service.settings.max_upload_bytes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"errorCode": "too_large"})

    job, signed = service.create_signed_upload(payload.content_type, str(request.base_url).rstrip("/"))
    return UploadSignResponse(
        job_id=job.job_id,
        upload_url=signed["upload_url"],
        object_path=signed["object_path"],
        expires_in_seconds=signed["expires_in_seconds"],
    ).model_copy()


@router.put("/uploads/mock/{job_id}/source", status_code=status.HTTP_204_NO_CONTENT)
async def mock_upload_source(
    job_id: str,
    request: Request,
    settings: Settings = Depends(get_settings),
) -> Response:
    if settings.use_gcs:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

    storage = StorageService(settings)
    job = storage.read_job(job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"errorCode": "job_not_found"})

    content_type = request.headers.get("content-type", "application/octet-stream").lower()
    if not content_type.startswith("image/"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"errorCode": "invalid_type"})

    data = await request.body()
    if len(data) > settings.max_upload_bytes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"errorCode": "too_large"})

    storage.save_local_upload(build_source_object_path(job_id), data)
    job.upload_completed = True
    job.updated_at = datetime.now(UTC)
    storage.write_job(job)

    service = JobService(settings, storage, VertexImagenService(settings))
    service.maybe_process_ready_job(job_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
