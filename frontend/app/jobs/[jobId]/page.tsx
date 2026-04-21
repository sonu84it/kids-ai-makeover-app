import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ChevronRight, ShieldCheck } from "lucide-react";

import { BeforeAfterSlider } from "@/components/BeforeAfterSlider";
import { ErrorStateCard } from "@/components/ErrorStateCard";
import { ResultActions } from "@/components/ResultActions";
import { JobResponse } from "@/lib/types";

function getServerApiUrl(path: string, headerList: Headers): string {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (configuredBaseUrl) {
    return `${configuredBaseUrl}${path}`;
  }

  const protocol = headerList.get("x-forwarded-proto") ?? "https";
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  if (!host) {
    throw new Error("missing_host_header");
  }
  return `${protocol}://${host}/api${path}`;
}

async function loadJob(jobId: string): Promise<JobResponse | null> {
  const headerList = headers();
  const response = await fetch(getServerApiUrl(`/v1/makeovers/${jobId}`, headerList), { cache: "no-store" });
  if (!response.ok) {
    return null;
  }
  return response.json();
}

export default async function JobPage({ params }: { params: { jobId: string } }) {
  const job = await loadJob(params.jobId);

  if (!job) {
    redirect("/app");
  }

  return (
    <div className="mx-auto max-w-5xl px-2 py-8 sm:px-4">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 shadow-sm">
            <ShieldCheck size={16} />
            Job result
          </div>
          <h1 className="mt-4 text-4xl font-extrabold text-gray-900">Makeover status: {job.status}</h1>
          <p className="mt-3 text-sm font-medium leading-6 text-gray-500">Job ID: {job.jobId}</p>
        </div>
        <Link href="/app" className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-5 py-3 text-sm font-extrabold text-white shadow-lg transition-all hover:-translate-y-1">
          Start another
          <ChevronRight size={18} />
        </Link>
      </div>

      {job.status === "completed" && job.sourceDownloadUrl && job.resultDownloadUrl ? (
        <>
          <BeforeAfterSlider beforeUrl={job.sourceDownloadUrl} afterUrl={job.resultDownloadUrl} presetLabel={job.presetId ?? undefined} />
          <ResultActions jobId={job.jobId} />
        </>
      ) : null}

      {job.status === "failed" ? (
        <div className="mt-8">
          <ErrorStateCard message={`This job failed with code: ${job.errorCode ?? "processing_failed"}`} />
        </div>
      ) : null}

      {job.status !== "completed" && job.status !== "failed" ? (
        <div className="glass-panel mt-8 p-6">
          <p className="text-lg font-extrabold text-gray-900">Your image is still being prepared.</p>
          <p className="mt-3 text-sm font-medium leading-7 text-gray-500">
            Refresh this page shortly if the result is still processing, or return to the app for live polling.
          </p>
        </div>
      ) : null}
    </div>
  );
}
