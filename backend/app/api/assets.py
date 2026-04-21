from fastapi import APIRouter, Depends, HTTPException, status

from app.config import Settings, get_settings
from app.models.schemas import ImageAssetQueryRequest, ImageAssetQueryResponse
from app.services.bigquery_assets import BigQueryAssetsError, BigQueryAssetsService
from app.services.storage import StorageService

router = APIRouter(prefix="/v1", tags=["assets"])


def get_assets_service(settings: Settings = Depends(get_settings)) -> BigQueryAssetsService:
    return BigQueryAssetsService(settings, StorageService(settings))


@router.post("/assets:query", response_model=ImageAssetQueryResponse)
def query_image_assets(
    payload: ImageAssetQueryRequest,
    service: BigQueryAssetsService = Depends(get_assets_service),
) -> ImageAssetQueryResponse:
    try:
        return service.query_images(payload)
    except BigQueryAssetsError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"errorCode": exc.code, "message": str(exc)})
