from app.services.policy import PRESET_MAP, build_instruction_text


def test_all_presets_exist() -> None:
    assert set(PRESET_MAP.keys()) == {"superhero", "astronaut", "royal", "jungle", "festive"}


def test_instruction_includes_guardrails() -> None:
    instruction = build_instruction_text("superhero")
    assert "Preserve the child's identity" in instruction
    assert "moustaches" in instruction
