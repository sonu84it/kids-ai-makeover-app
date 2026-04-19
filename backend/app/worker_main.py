import json
import logging
from datetime import UTC, datetime

from fastapi import Depends, FastAPI, HTTPException, Request, status

from app.config import Settings, get_settings
from app.services.jobs import JobService
from app.services.storage import StorageService
from app.services.vertex_imagen import VertexImagenService

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)

app = FastAPI(title="MagicTap Kids Worker", version="0.1.0")


def get_job_service(settings: Settings = Depends(get_settings)) -> JobService:
    storage = StorageService(settings)
    return JobService(settings, storage, VertexImagenService(settings))


@app.get("/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/events/storage")
async def handle_storage_event(
    request: Request,
    service: JobService = Depends(get_job_service),
) -> dict[str, str]:
    payload = await request.json()
    data = payload.get("data", payload)
    object_name = data.get("name", "")
    bucket = data.get("bucket", "")

    if not object_name.startswith("uploads/") or not object_name.endswith("/source.jpg"):
        return {"status": "ignored"}

    if bucket and service.settings.upload_bucket and bucket != service.settings.upload_bucket:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="unexpected_bucket")

    parts = object_name.split("/")
    if len(parts) < 3:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="invalid_object_path")

    job_id = parts[1]
    job = service.storage.read_job(job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="job_not_found")

    job.upload_completed = True
    job.updated_at = datetime.now(UTC)
    service.storage.write_job(job)
    result = service.maybe_process_ready_job(job_id)
    return {"status": result.status if result else "accepted"}


@app.post("/internal/process/{job_id}")
def process_job(job_id: str, service: JobService = Depends(get_job_service)) -> dict[str, str]:
    result = service.process_job(job_id)
    return json.loads(result.model_dump_json())
