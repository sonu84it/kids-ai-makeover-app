#!/usr/bin/env bash
set -euo pipefail

: "${GOOGLE_CLOUD_PROJECT:?Set GOOGLE_CLOUD_PROJECT}"
: "${GOOGLE_CLOUD_LOCATION:?Set GOOGLE_CLOUD_LOCATION}"
: "${UPLOAD_BUCKET:?Set UPLOAD_BUCKET}"
: "${WORKER_SERVICE:?Set WORKER_SERVICE}"
: "${WORKER_SERVICE_ACCOUNT:?Set WORKER_SERVICE_ACCOUNT}"

gcloud eventarc triggers create magictap-kids-upload-finalized \
  --project="$GOOGLE_CLOUD_PROJECT" \
  --location="$GOOGLE_CLOUD_LOCATION" \
  --destination-run-service="$WORKER_SERVICE" \
  --destination-run-region="$GOOGLE_CLOUD_LOCATION" \
  --event-filters="type=google.cloud.storage.object.v1.finalized" \
  --event-filters="bucket=$UPLOAD_BUCKET" \
  --service-account="$WORKER_SERVICE_ACCOUNT" \
  --destination-run-path="/events/storage"
