from app.services.storage import build_job_object_path, build_result_object_path, build_source_object_path


def test_storage_paths_are_deterministic() -> None:
    assert build_source_object_path("abc123") == "uploads/abc123/source.jpg"
    assert build_result_object_path("abc123") == "results/abc123/final.png"
    assert build_job_object_path("abc123") == "jobs/abc123.json"
