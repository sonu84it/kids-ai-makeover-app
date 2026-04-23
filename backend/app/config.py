from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    google_cloud_project: str = Field(default="local-project", alias="GOOGLE_CLOUD_PROJECT")
    google_cloud_location: str = Field(default="us-central1", alias="GOOGLE_CLOUD_LOCATION")
    bigquery_project: str = Field(default="", alias="BIGQUERY_PROJECT")
    bigquery_location: str = Field(default="", alias="BIGQUERY_LOCATION")
    bigquery_object_table: str = Field(default="", alias="BIGQUERY_OBJECT_TABLE")
    upload_bucket: str = Field(default="", alias="UPLOAD_BUCKET")
    result_bucket: str = Field(default="", alias="RESULT_BUCKET")
    image_provider: str = Field(default="imagen", alias="IMAGE_PROVIDER")
    vertex_imagen_model: str = Field(default="imagen-3.0-capability-001", alias="VERTEX_IMAGEN_MODEL")
    gemini_image_model: str = Field(default="gemini-2.5-flash-image", alias="GEMINI_IMAGE_MODEL")
    gemini_image_location: str = Field(default="global", alias="GEMINI_IMAGE_LOCATION")
    signed_url_expiry_seconds: int = Field(default=900, alias="SIGNED_URL_EXPIRY_SECONDS")
    job_url_expiry_seconds: int = Field(default=900, alias="JOB_URL_EXPIRY_SECONDS")
    enable_mock_ai: bool = Field(default=True, alias="ENABLE_MOCK_AI")
    max_upload_mb: int = Field(default=10, alias="MAX_UPLOAD_MB")
    local_data_dir: Path = Field(default=Path("./data"), alias="LOCAL_DATA_DIR")
    max_image_dimension: int = Field(default=1536, alias="MAX_IMAGE_DIMENSION")
    min_image_dimension: int = Field(default=256, alias="MIN_IMAGE_DIMENSION")

    @property
    def effective_result_bucket(self) -> str:
        return self.result_bucket or self.upload_bucket

    @property
    def effective_bigquery_project(self) -> str:
        return self.bigquery_project or self.google_cloud_project

    @property
    def effective_bigquery_location(self) -> str:
        return self.bigquery_location or self.google_cloud_location

    @property
    def max_upload_bytes(self) -> int:
        return self.max_upload_mb * 1024 * 1024

    @property
    def use_gcs(self) -> bool:
        return bool(self.upload_bucket and self.effective_result_bucket)


@lru_cache
def get_settings() -> Settings:
    return Settings()
