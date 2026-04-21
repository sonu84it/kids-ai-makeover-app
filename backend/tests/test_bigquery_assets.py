from app.config import Settings
from app.models.schemas import ImageAssetQueryRequest
from app.services.bigquery_assets import BigQueryAssetsService
from app.services.storage import StorageService


def test_build_sql_without_prefix() -> None:
    settings = Settings(
        GOOGLE_CLOUD_PROJECT="test-project",
        GOOGLE_CLOUD_LOCATION="us-central1",
        BIGQUERY_OBJECT_TABLE="test-project.media.object_assets",
    )
    service = BigQueryAssetsService(settings, StorageService(settings))

    sql = service._build_sql(ImageAssetQueryRequest(limit=10))

    assert "FROM `test-project.media.object_assets`" in sql
    assert "content_type IN UNNEST(@content_types)" in sql
    assert "STARTS_WITH(uri, @uri_prefix)" not in sql
    assert "LIMIT @limit" in sql


def test_build_sql_with_prefix() -> None:
    settings = Settings(
        GOOGLE_CLOUD_PROJECT="test-project",
        GOOGLE_CLOUD_LOCATION="us-central1",
        BIGQUERY_OBJECT_TABLE="test-project.media.object_assets",
    )
    service = BigQueryAssetsService(settings, StorageService(settings))

    sql = service._build_sql(ImageAssetQueryRequest(prefix="gs://bucket/results/", limit=5))

    assert "STARTS_WITH(uri, @uri_prefix)" in sql


def test_parse_gcs_uri() -> None:
    settings = Settings(
        GOOGLE_CLOUD_PROJECT="test-project",
        GOOGLE_CLOUD_LOCATION="us-central1",
        BIGQUERY_OBJECT_TABLE="test-project.media.object_assets",
    )
    service = BigQueryAssetsService(settings, StorageService(settings))

    parsed = service._parse_gcs_uri("gs://magic-bucket/results/job-123/final.png")

    assert parsed.bucket_name == "magic-bucket"
    assert parsed.object_path == "results/job-123/final.png"
