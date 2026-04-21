import logging
from dataclasses import dataclass
from urllib.parse import urlparse

from google.cloud import bigquery
from google.api_core.exceptions import BadRequest, Forbidden

from app.config import Settings
from app.models.schemas import ImageAssetQueryRequest, ImageAssetQueryResponse, ImageAssetRecord
from app.services.storage import StorageService

logger = logging.getLogger(__name__)


class BigQueryAssetsError(Exception):
    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code


@dataclass(frozen=True)
class ParsedGcsUri:
    bucket_name: str
    object_path: str


class BigQueryAssetsService:
    def __init__(self, settings: Settings, storage: StorageService):
        self.settings = settings
        self.storage = storage
        self._client = (
            bigquery.Client(
                project=settings.effective_bigquery_project,
                location=settings.effective_bigquery_location,
            )
            if settings.bigquery_object_table
            else None
        )

    def ensure_enabled(self) -> None:
        if not self.settings.bigquery_object_table:
            raise BigQueryAssetsError("bigquery_not_configured", "BIGQUERY_OBJECT_TABLE is not configured.")

    def query_images(self, payload: ImageAssetQueryRequest) -> ImageAssetQueryResponse:
        self.ensure_enabled()
        sql = self._build_sql(payload)

        query_parameters = [
            bigquery.ArrayQueryParameter("content_types", "STRING", ["image/jpeg", "image/png", "image/webp", "image/jpg"]),
            bigquery.ScalarQueryParameter("limit", "INT64", payload.limit),
        ]
        if payload.prefix:
            query_parameters.append(bigquery.ScalarQueryParameter("uri_prefix", "STRING", payload.prefix))

        job_config = bigquery.QueryJobConfig(query_parameters=query_parameters)

        try:
            query_job = self._client.query(sql, job_config=job_config)
        except Forbidden as exc:
            raise BigQueryAssetsError("bigquery_forbidden", "BigQuery access is not configured for this service.") from exc
        except BadRequest as exc:
            raise BigQueryAssetsError("bigquery_bad_query", str(exc)) from exc

        rows = []
        try:
            result_rows = query_job.result()
        except Forbidden as exc:
            raise BigQueryAssetsError("bigquery_forbidden", "BigQuery access is not configured for this service.") from exc
        except BadRequest as exc:
            raise BigQueryAssetsError("bigquery_bad_query", str(exc)) from exc

        for row in result_rows:
            parsed = self._parse_gcs_uri(row["uri"])
            signed_url = None
            if payload.include_signed_urls and self.settings.use_gcs:
                signed_url = self.storage.signed_download_url(parsed.bucket_name, parsed.object_path)
            rows.append(
                ImageAssetRecord(
                    uri=row["uri"],
                    bucketName=parsed.bucket_name,
                    objectPath=parsed.object_path,
                    contentType=row.get("content_type"),
                    size=row.get("size"),
                    generation=row.get("generation"),
                    signedUrl=signed_url,
                )
            )

        return ImageAssetQueryResponse(sql=sql, rows=rows)

    def _build_sql(self, payload: ImageAssetQueryRequest) -> str:
        table = self.settings.bigquery_object_table
        where = [
            "content_type IN UNNEST(@content_types)",
        ]
        if payload.prefix:
            where.append("STARTS_WITH(uri, @uri_prefix)")

        return (
            "SELECT uri, content_type, size, generation\n"
            f"FROM `{table}`\n"
            f"WHERE {' AND '.join(where)}\n"
            "ORDER BY uri DESC\n"
            "LIMIT @limit"
        )

    def _parse_gcs_uri(self, uri: str) -> ParsedGcsUri:
        parsed = urlparse(uri)
        if parsed.scheme != "gs" or not parsed.netloc or not parsed.path:
            raise BigQueryAssetsError("invalid_gcs_uri", f"Unsupported object table URI: {uri}")
        return ParsedGcsUri(bucket_name=parsed.netloc, object_path=parsed.path.lstrip("/"))
