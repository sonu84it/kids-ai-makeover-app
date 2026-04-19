import io
from dataclasses import dataclass

from PIL import Image, ImageDraw, ImageOps

from app.config import Settings


SUPPORTED_CONTENT_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}


class PreprocessError(Exception):
    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code


@dataclass
class PreprocessResult:
    image_bytes: bytes
    image_content_type: str
    mask_bytes: bytes | None
    width: int
    height: int


def _ensure_supported_type(content_type: str) -> None:
    if content_type.lower() not in SUPPORTED_CONTENT_TYPES:
        raise PreprocessError("invalid_type", "Unsupported image type.")


def _save_image(image: Image.Image, format_name: str) -> tuple[bytes, str]:
    output = io.BytesIO()
    if format_name == "PNG":
        image.save(output, format="PNG")
        return output.getvalue(), "image/png"
    rgb_image = image.convert("RGB")
    rgb_image.save(output, format="JPEG", quality=92, optimize=True)
    return output.getvalue(), "image/jpeg"


def _build_face_preserving_mask(size: tuple[int, int]) -> bytes:
    width, height = size
    mask = Image.new("L", size, 255)
    draw = ImageDraw.Draw(mask)
    face_box = (
        int(width * 0.24),
        int(height * 0.08),
        int(width * 0.76),
        int(height * 0.56),
    )
    draw.ellipse(face_box, fill=0)
    output = io.BytesIO()
    mask.save(output, format="PNG")
    return output.getvalue()


def preprocess_image(image_bytes: bytes, content_type: str, settings: Settings) -> PreprocessResult:
    _ensure_supported_type(content_type)

    if len(image_bytes) > settings.max_upload_bytes:
        raise PreprocessError("too_large", "The uploaded image is larger than allowed.")

    try:
        image = Image.open(io.BytesIO(image_bytes))
    except Exception as exc:  # pragma: no cover - Pillow emits several exception types
        raise PreprocessError("invalid_type", "The uploaded file could not be read as an image.") from exc

    image = ImageOps.exif_transpose(image)

    if min(image.size) < settings.min_image_dimension:
        raise PreprocessError("image_too_small", "The uploaded image is too small for a makeover.")

    image = image.convert("RGBA")
    if max(image.size) > settings.max_image_dimension:
        image.thumbnail((settings.max_image_dimension, settings.max_image_dimension))

    width, height = image.size
    if width < settings.min_image_dimension or height < settings.min_image_dimension:
        raise PreprocessError("image_too_small", "The processed image is too small for a makeover.")

    subject_ratio = min(width, height) / max(width, height)
    if subject_ratio < 0.45:
        raise PreprocessError("subject_not_clear", "Please upload a clearer child portrait or half-body image.")

    image_bytes_out, out_content_type = _save_image(image, "JPEG")
    mask_bytes = _build_face_preserving_mask((width, height))

    return PreprocessResult(
        image_bytes=image_bytes_out,
        image_content_type=out_content_type,
        mask_bytes=mask_bytes,
        width=width,
        height=height,
    )
