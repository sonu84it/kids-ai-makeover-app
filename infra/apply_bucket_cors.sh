#!/usr/bin/env bash
set -euo pipefail

: "${UPLOAD_BUCKET:?Set UPLOAD_BUCKET}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

gcloud storage buckets update "gs://${UPLOAD_BUCKET}" \
  --cors-file="${SCRIPT_DIR}/storage-cors.json"
