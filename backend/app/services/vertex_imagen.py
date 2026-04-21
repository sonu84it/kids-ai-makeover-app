import base64
import io
import json
import logging
import time

import google.auth
from google.auth.transport.requests import AuthorizedSession
from requests import RequestException
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
        try:
            return self._call_vertex_imagen(image_bytes, instruction, mask_bytes)
        except VertexImagenError as exc:
            logger.warning(
                "vertex_imagen_fallback_to_mock code=%s model=%s message=%s",
                exc.code,
                self.settings.vertex_imagen_model,
                str(exc)[:500],
            )
            return self._mock_edit(image_bytes, instruction)

    def _call_vertex_imagen(self, image_bytes: bytes, instruction: str, mask_bytes: bytes | None) -> bytes:
        credentials, _ = google.auth.default(scopes=["https://www.googleapis.com/auth/cloud-platform"])
        session = AuthorizedSession(credentials)
        url = (
            f"https://{self.settings.google_cloud_location}-aiplatform.googleapis.com/v1/projects/"
            f"{self.settings.google_cloud_project}/locations/{self.settings.google_cloud_location}/publishers/google/"
            f"models/{self.settings.vertex_imagen_model}:predict"
        )
        reference_images: list[dict[str, object]] = [
            {
                "referenceType": "REFERENCE_TYPE_RAW",
                "referenceId": 1,
                "referenceImage": {"bytesBase64Encoded": base64.b64encode(image_bytes).decode("utf-8")},
            }
        ]
        if mask_bytes:
            reference_images.append(
                {
                    "referenceType": "REFERENCE_TYPE_MASK",
                    "referenceId": 2,
                    "referenceImage": {"bytesBase64Encoded": base64.b64encode(mask_bytes).decode("utf-8")},
                    "maskImageConfig": {"maskMode": "MASK_MODE_USER_PROVIDED"},
                }
            )

        instance: dict[str, object] = {
            "prompt": instruction,
            "referenceImages": reference_images,
        }

        payload = {
            "instances": [instance],
            "parameters": {
                "addWatermark": False,
                "editMode": "EDIT_MODE_INPAINT_INSERTION",
                "includeRaiReason": True,
                "includeSafetyAttributes": True,
                "personGeneration": "allow_all",
                "sampleCount": 1,
                "outputOptions": {"mimeType": "image/png"},
                "negativePrompt": (
                    "adult makeup, facial hair, moustache, body-shape changes, unsafe props, weapons, "
                    "mature styling, sexualized appearance"
                ),
            },
        }

        last_error: Exception | None = None
        for attempt in range(3):
            try:
                response = session.post(url, json=payload, timeout=120)
            except RequestException as exc:
                last_error = VertexImagenError("vertex_request_failed", str(exc))
                logger.warning(
                    "vertex_imagen_transport_failed attempt=%s model=%s message=%s",
                    attempt + 1,
                    self.settings.vertex_imagen_model,
                    str(exc)[:500],
                )
                time.sleep(2**attempt)
                continue
            if response.ok:
                body = response.json()
                try:
                    prediction = body["predictions"][0]
                    encoded = self._extract_image_bytes(prediction)
                    if not encoded:
                        raise VertexImagenError("vertex_bad_response", "Vertex AI did not return image bytes.")
                    return base64.b64decode(encoded)
                except Exception as exc:
                    logger.warning(
                        "vertex_imagen_response_parse_failed model=%s body=%s",
                        self.settings.vertex_imagen_model,
                        json.dumps(body)[:1000].replace("\n", " "),
                    )
                    raise VertexImagenError("vertex_bad_response", "Could not parse Vertex AI response.") from exc
            response_excerpt = response.text[:1000].replace("\n", " ")
            last_error = VertexImagenError("vertex_request_failed", response_excerpt)
            logger.warning(
                "vertex_imagen_request_failed attempt=%s status_code=%s model=%s body=%s",
                attempt + 1,
                response.status_code,
                self.settings.vertex_imagen_model,
                response_excerpt,
            )
            time.sleep(2**attempt)

        raise last_error or VertexImagenError("vertex_request_failed", "Vertex AI request failed.")

    def _extract_image_bytes(self, payload: object) -> str | None:
        if isinstance(payload, dict):
            direct = payload.get("bytesBase64Encoded")
            if isinstance(direct, str) and direct:
                return direct

            image = payload.get("image")
            if isinstance(image, dict):
                nested = image.get("bytesBase64Encoded")
                if isinstance(nested, str) and nested:
                    return nested

            images = payload.get("images")
            if isinstance(images, list):
                for item in images:
                    nested = self._extract_image_bytes(item)
                    if nested:
                        return nested

            predictions = payload.get("predictions")
            if isinstance(predictions, list):
                for item in predictions:
                    nested = self._extract_image_bytes(item)
                    if nested:
                        return nested

            for value in payload.values():
                nested = self._extract_image_bytes(value)
                if nested:
                    return nested

        if isinstance(payload, list):
            for item in payload:
                nested = self._extract_image_bytes(item)
                if nested:
                    return nested

        return None

    def _mock_edit(self, image_bytes: bytes, instruction: str) -> bytes:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGBA")
        width, height = image.size
        overlay = Image.new("RGBA", image.size, (255, 255, 255, 0))
        draw = ImageDraw.Draw(overlay)
        theme = self._mock_theme(instruction)

        draw.rectangle([(0, 0), (width, height)], fill=theme["background"])
        draw.ellipse(
            [(width * 0.06, height * 0.05), (width * 0.94, height * 0.78)],
            fill=(255, 255, 255, 48),
        )
        draw.rounded_rectangle(
            [(width * 0.04, height * 0.04), (width * 0.96, height * 0.96)],
            radius=max(18, int(width * 0.04)),
            outline=theme["outline"],
            width=max(6, width // 120),
        )

        shoulder_top = int(height * 0.56)
        draw.rounded_rectangle(
            [(width * 0.18, shoulder_top), (width * 0.82, height * 0.96)],
            radius=max(20, int(width * 0.05)),
            fill=theme["costume"],
        )
        draw.polygon(
            [
                (width * 0.5, height * 0.63),
                (width * 0.57, height * 0.76),
                (width * 0.5, height * 0.88),
                (width * 0.43, height * 0.76),
            ],
            fill=theme["accent"],
        )
        draw.ellipse(
            [(width * 0.38, height * 0.62), (width * 0.62, height * 0.86)],
            outline=(255, 255, 255, 180),
            width=max(4, width // 180),
        )

        draw.rounded_rectangle(
            [(width * 0.05, height * 0.76), (width * 0.95, height * 0.95)],
            radius=24,
            fill=(18, 25, 38, 188),
        )
        font = ImageFont.load_default()
        draw.text((width * 0.1, height * 0.8), theme["title"], fill=(255, 255, 255, 255), font=font)
        draw.text((width * 0.1, height * 0.87), instruction[:64], fill=(228, 235, 255, 255), font=font)
        combined = Image.alpha_composite(image, overlay).convert("RGB")
        output = io.BytesIO()
        combined.save(output, format="PNG")
        return output.getvalue()

    def _mock_theme(self, instruction: str) -> dict[str, object]:
        lowered = instruction.lower()
        if "astronaut" in lowered:
            return {
                "title": "Astronaut Preview",
                "background": (30, 45, 110, 120),
                "costume": (214, 224, 236, 150),
                "accent": (125, 170, 255, 180),
                "outline": (190, 216, 255, 220),
            }
        if "royal" in lowered:
            return {
                "title": "Royal Preview",
                "background": (128, 83, 22, 118),
                "costume": (178, 35, 52, 150),
                "accent": (240, 197, 76, 190),
                "outline": (253, 225, 144, 220),
            }
        if "jungle" in lowered or "explorer" in lowered:
            return {
                "title": "Explorer Preview",
                "background": (35, 102, 61, 118),
                "costume": (120, 92, 54, 150),
                "accent": (164, 214, 110, 180),
                "outline": (156, 225, 172, 220),
            }
        if "festive" in lowered:
            return {
                "title": "Festive Preview",
                "background": (154, 50, 74, 118),
                "costume": (255, 134, 87, 145),
                "accent": (255, 217, 88, 180),
                "outline": (255, 214, 214, 220),
            }
        return {
            "title": "Superhero Preview",
            "background": (49, 78, 160, 122),
            "costume": (194, 31, 31, 145),
            "accent": (255, 214, 76, 185),
            "outline": (160, 202, 255, 220),
        }
