"use client";

import { JobResponse } from "@/lib/types";

const copyByStatus = {
  pending: "Uploaded and waiting for processing.",
  processing: "Processing the makeover with a preset-driven edit.",
  completed: "Your makeover is ready.",
  failed: "This photo could not be processed.",
  deleted: "This job was deleted."
} as const;

interface ProgressStatePanelProps {
  job: JobResponse | null;
  uploadState: "idle" | "uploading" | "uploaded" | "submitting";
}

export function ProgressStatePanel({ job, uploadState }: ProgressStatePanelProps) {
  const status = job?.status ?? (uploadState === "uploading" ? "pending" : null);
  const stages = [
    { label: "Signed upload", done: uploadState !== "idle" },
    { label: "Image stored", done: uploadState === "uploaded" || uploadState === "submitting" || !!job },
    { label: "Worker running", done: job?.status === "processing" || job?.status === "completed" },
    { label: "Result ready", done: job?.status === "completed" }
  ];

  return (
    <div className="panel p-6">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ink/55">3. Track progress</p>
      <h3 className="mt-1 text-xl font-semibold">Live job state</h3>

      <div className="mt-6 grid gap-3">
        {stages.map((stage) => (
          <div
            key={stage.label}
            className={`flex items-center justify-between rounded-2xl px-4 py-3 ${
              stage.done ? "bg-ink text-white" : "bg-mist text-ink/70"
            }`}
          >
            <span className="font-medium">{stage.label}</span>
            <span className="text-sm">{stage.done ? "Done" : "Waiting"}</span>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-[24px] bg-white px-4 py-4">
        <p className="text-sm font-semibold text-ink/60">Current status</p>
        <p className="mt-2 text-lg font-semibold">{status ? status.charAt(0).toUpperCase() + status.slice(1) : "Not started"}</p>
        <p className="mt-2 text-sm leading-6 text-ink/70">
          {status ? copyByStatus[status] : "Upload a photo, choose a preset, and we’ll create a makeover job."}
        </p>
        {job?.errorCode ? <p className="mt-3 text-sm font-semibold text-[#b3472c]">Error: {job.errorCode}</p> : null}
      </div>
    </div>
  );
}
