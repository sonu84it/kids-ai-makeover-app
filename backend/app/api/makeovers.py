from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.responses import FileResponse

from app.config import Settings, get_settings
from app.models.schemas import CreateMakeoverRequest, JobResponse
from app.services.jobs import JobService
from app.services.storage import StorageService
from app.services.vertex_imagen import VertexImagenService

router = APIRouter(prefix="/v1", tags=["makeovers"])


def get_job_service(settings: Settings = Depends(get_settings)) -> JobService:
    storage = StorageService(settings)
    return JobService(settings, storage, VertexImagenService(settings))


@router.post("/makeovers", response_model=JobResponse)
def create_makeover(
    payload: CreateMakeoverRequest,
    request: Request,
    service: JobService = Depends(get_job_service),
) -> JobResponse:
    try:
        job = service.mark_makeover_ready(payload)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"errorCode": "job_not_found"})

    if job.upload_completed:
        service.maybe_process_ready_job(job.job_id)

    refreshed = service.get_job_response(job.job_id, str(request.base_url).rstrip("/"))
    assert refreshed is not None
    return refreshed


@router.get("/makeovers/{job_id}", response_model=JobResponse)
def get_makeover(job_id: str, request: Request, service: JobService = Depends(get_job_service)) -> JobResponse:
    response = service.get_job_response(job_id, str(request.base_url).rstrip("/"))
    if not response:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"errorCode": "job_not_found"})
    return response


@router.delete("/makeovers/{job_id}", response_model=JobResponse)
def delete_makeover(job_id: str, request: Request, service: JobService = Depends(get_job_service)) -> JobResponse:
    job = service.storage.read_job(job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"errorCode": "job_not_found"})

    if service.settings.use_gcs:
        service.storage.delete_job_assets(job_id)
        job.deleted = True
        job.status = "deleted"
        job.updated_at = datetime.now(UTC)
        service.storage.write_job(job)
    else:
        service.delete_job(job_id)

    response = service.get_job_response(job_id, str(request.base_url).rstrip("/"))
    assert response is not None
    return response


@router.get("/assets/{asset_path:path}")
def get_local_asset(asset_path: str, settings: Settings = Depends(get_settings)) -> FileResponse:
    if settings.use_gcs:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    file_path = settings.local_data_dir / asset_path
    if not file_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    return FileResponse(path=file_path)
