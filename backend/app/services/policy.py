from dataclasses import dataclass

from app.models.schemas import PresetId


GLOBAL_SAFETY_GUARDRAILS = (
    "Preserve the child's identity, facial features, age-appropriate appearance, and skin tone. "
    "Keep the expression natural. Avoid moustaches, facial hair, adultification, sexualized styling, "
    "body-shape changes, mature makeup, heavy cosmetics, weapons emphasis, or unsafe props."
)


@dataclass(frozen=True)
class PresetDefinition:
    id: PresetId
    label: str
    short_description: str
    instruction: str


PRESET_MAP: dict[PresetId, PresetDefinition] = {
    "superhero": PresetDefinition(
        id="superhero",
        label="Superhero",
        short_description="Heroic costume with a family-friendly cinematic feel.",
        instruction=(
            "Create a child-safe superhero makeover. Preserve the face. Add a bright heroic costume, "
            "gentle cinematic lighting, and a playful city-hero atmosphere. No facial hair, no weapon focus, "
            "no adult proportions."
        ),
    ),
    "astronaut": PresetDefinition(
        id="astronaut",
        label="Astronaut",
        short_description="Clean futuristic suit with a soft sci-fi backdrop.",
        instruction=(
            "Create a child-safe astronaut makeover. Preserve the face. Add a clean futuristic astronaut suit, "
            "soft sci-fi background, and gentle helmet styling while keeping the expression natural."
        ),
    ),
    "royal": PresetDefinition(
        id="royal",
        label="Royal",
        short_description="Elegant child-safe royal attire in a warm palace setting.",
        instruction=(
            "Create an elegant royal makeover for a child. Preserve the face. Add child-safe royal attire, "
            "warm palace-inspired styling, and tasteful details. Avoid mature cosmetics and exaggerated jewelry."
        ),
    ),
    "jungle": PresetDefinition(
        id="jungle",
        label="Jungle Explorer",
        short_description="Adventure outfit with lush greenery and safe explorer details.",
        instruction=(
            "Create a jungle explorer makeover for a child. Preserve the face. Add a safe explorer outfit, "
            "lush greenery, and a playful outdoor adventure tone. No dangerous props."
        ),
    ),
    "festive": PresetDefinition(
        id="festive",
        label="Festive",
        short_description="Bright celebratory style with warm family-event energy.",
        instruction=(
            "Create a festive child makeover. Preserve the face. Add a bright traditional festive outfit, "
            "warm celebratory colors, and a family-event feel while keeping the look age-appropriate."
        ),
    ),
}


def get_preset_definition(preset_id: PresetId) -> PresetDefinition:
    return PRESET_MAP[preset_id]


def build_instruction_text(preset_id: PresetId) -> str:
    preset = get_preset_definition(preset_id)
    return f"{preset.instruction} {GLOBAL_SAFETY_GUARDRAILS}"
