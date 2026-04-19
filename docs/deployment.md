# Deployment Notes

## Required Google Cloud APIs

- `run.googleapis.com`
- `eventarc.googleapis.com`
- `artifactregistry.googleapis.com`
- `cloudbuild.googleapis.com`
- `storage.googleapis.com`
- `aiplatform.googleapis.com`

## Buckets

- Use one bucket with prefixes or two buckets.
- Upload source objects live at `uploads/{jobId}/source.jpg`.
- Results live at `results/{jobId}/final.png`.
- Job metadata lives at `jobs/{jobId}.json`.

## IAM Notes

- API Cloud Run service account:
  - `roles/storage.objectAdmin` on the asset bucket
  - `roles/iam.serviceAccountTokenCreator` if your org requires explicit signed URL support
- Worker Cloud Run service account:
  - `roles/storage.objectAdmin`
  - `roles/aiplatform.user`
- Eventarc trigger service account:
  - `roles/run.invoker` on the worker service
  - `roles/eventarc.eventReceiver`

## Eventarc Pattern

- Trigger on `google.cloud.storage.object.v1.finalized`
- Filter by the upload bucket
- Deliver to the worker Cloud Run service path `/events/storage`

## Bucket Naming Notes

- Prefer globally unique lowercase bucket names.
- For production, keep lifecycle rules short for raw uploads and somewhat longer for generated results if needed.
