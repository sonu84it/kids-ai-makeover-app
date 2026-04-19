import base64
import io
import logging
import time

import google.auth
from google.auth.transport.requests import AuthorizedSession
from PIL import Image, ImageDraw, ImageFont

from app.config import Settings

logger = logging.getLogger(__name__)


class VertexImagenError(Exception):
    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code


class VertexImagenService:
    def __init__(self, settings: Settings):
        self.settings = settings

    def edit_image(self, image_bytes: bytes, instruction: str, mask_bytes: bytes | None = None) -> bytes:
        if self.settings.enable_mock_ai:
            return self._mock_edit(image_bytes, instruction)
        return self._call_vertex_imagen(image_bytes, instruction, mask_bytes)

    def _call_vertex_imagen(self, image_bytes: bytes, instruction: str, mask_bytes: bytes | None) -> bytes:
        credentials, _ = google.auth.default(scopes=["https://www.googleapis.com/auth/cloud-platform"])
        session = AuthorizedSession(credentials)
        url = (
            f"https://{self.settings.google_cloud_location}-aiplatform.googleapis.com/v1/projects/"
            f"{self.settings.google_cloud_project}/locations/{self.settings.google_cloud_location}/publishers/google/"
            f"models/{self.settings.vertex_imagen_model}:predict"
        )
        instance: dict[str, object] = {
            "prompt": instruction,
            "referenceImages": [
                {
                    "referenceType": "REFERENCE_TYPE_RAW",
                    "referenceImage": {"bytesBase64Encoded": base64.b64encode(image_bytes).decode("utf-8")},
                }
            ],
        }
        if mask_bytes:
            instance["mask"] = {"image": {"bytesBase64Encoded": base64.b64encode(mask_bytes).decode("utf-8")}}

        payload = {
            "instances": [instance],
            "parameters": {
                "sampleCount": 1,
                "includeSafetyAttributes": True,
                "outputOptions": {"mimeType": "image/png"},
                "negativePrompt": (
                    "adult makeup, facial hair, moustache, body-shape changes, unsafe props, weapons, "
                    "mature styling, sexualized appearance"
                ),
            },
        }

        last_error: Exception | None = None
        for attempt in range(3):
            response = session.post(url, json=payload, timeout=120)
            if response.ok:
                body = response.json()
                try:
                    prediction = body["predictions"][0]
                    encoded = prediction.get("bytesBase64Encoded") or prediction.get("mimeType") and prediction.get("bytesBase64Encoded")
                    if not encoded:
                        encoded = prediction.get("image", {}).get("bytesBase64Encoded")
                    if not encoded:
                        raise VertexImagenError("vertex_bad_response", "Vertex AI did not return image bytes.")
                    return base64.b64decode(encoded)
                except Exception as exc:
                    raise VertexImagenError("vertex_bad_response", "Could not parse Vertex AI response.") from exc
            last_error = VertexImagenError("vertex_request_failed", response.text[:500])
            logger.warning(
                "vertex_imagen_request_failed",
                extra={"attempt": attempt + 1, "status_code": response.status_code},
            )
            time.sleep(2**attempt)

        raise last_error or VertexImagenError("vertex_request_failed", "Vertex AI request failed.")

    def _mock_edit(self, image_bytes: bytes, instruction: str) -> bytes:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGBA")
        overlay = Image.new("RGBA", image.size, (255, 255, 255, 0))
        draw = ImageDraw.Draw(overlay)
        width, height = image.size
        draw.rounded_rectangle(
            [(width * 0.05, height * 0.74), (width * 0.95, height * 0.95)],
            radius=24,
            fill=(28, 77, 168, 185),
        )
        font = ImageFont.load_default()
        text = "MagicTap Kids Preview"
        draw.text((width * 0.1, height * 0.79), text, fill=(255, 255, 255, 255), font=font)
        draw.text((width * 0.1, height * 0.86), instruction[:72], fill=(240, 244, 255, 255), font=font)
        combined = Image.alpha_composite(image, overlay).convert("RGB")
        output = io.BytesIO()
        combined.save(output, format="PNG")
        return output.getvalue()
