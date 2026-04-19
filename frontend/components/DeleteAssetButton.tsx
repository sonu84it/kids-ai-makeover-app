"use client";

import { useState } from "react";

interface DeleteAssetButtonProps {
  jobId: string;
  onDelete: () => Promise<void>;
}

export function DeleteAssetButton({ jobId, onDelete }: DeleteAssetButtonProps) {
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await onDelete();
        } finally {
          setBusy(false);
        }
      }}
      className="rounded-full border border-ink/15 bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-ink disabled:cursor-not-allowed disabled:opacity-60"
    >
      {busy ? "Deleting..." : `Delete job ${jobId.slice(0, 8)}`}
    </button>
  );
}
