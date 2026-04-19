"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  ChevronRight,
  Crown,
  Gift,
  ImageIcon,
  Loader2,
  Rocket,
  ShieldCheck,
  TreePine,
  Trash2,
  Upload
} from "lucide-react";

import { createMakeover, deleteJob, getJob, signUpload, uploadFile } from "@/lib/api";
import { PRESETS } from "@/lib/presets";
import { PresetId, JobResponse } from "@/lib/types";
import { BeforeAfterSlider } from "./BeforeAfterSlider";
import { ErrorStateCard } from "./ErrorStateCard";

const ICONS = {
  camera: Camera,
  rocket: Rocket,
  crown: Crown,
  tree: TreePine,
  gift: Gift
} as const;

export function AppClient() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [presetId, setPresetId] = useState<PresetId | null>("superhero");
  const [job, setJob] = useState<JobResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "uploaded" | "submitting">("idle");

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!job?.jobId || job.status === "completed" || job.status === "failed" || job.status === "deleted") {
      return;
    }
    const interval = window.setInterval(async () => {
      const next = await getJob(job.jobId);
      setJob(next);
      if (next.status === "completed") {
        router.push(`/jobs/${next.jobId}`);
      }
    }, 2500);
    return () => window.clearInterval(interval);
  }, [job?.jobId, job?.status, router]);

  const canGenerate = useMemo(() => Boolean(file && presetId), [file, presetId]);
  const activePreset = PRESETS.find((preset) => preset.id === presetId) ?? PRESETS[0];

  async function handleGenerate() {
    if (!file || !presetId) {
      setError("Please upload one image and choose a preset style.");
      return;
    }
    try {
      setError(null);
      setUploadState("uploading");
      const signed = await signUpload(file);
      await uploadFile(signed.uploadUrl, file);
      setUploadState("uploaded");
      const createdJob = await createMakeover(signed.jobId, presetId);
      setUploadState("submitting");
      setJob(createdJob);
      if (createdJob.status === "completed") {
        router.push(`/jobs/${createdJob.jobId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create makeover.");
      setUploadState("idle");
    }
  }

  async function handleDelete() {
    if (!job?.jobId) {
      return;
    }
    await deleteJob(job.jobId);
    setJob(null);
    setFile(null);
    setPresetId("superhero");
    setUploadState("idle");
  }

  function handleFileChange(nextFile: File | null) {
    if (!nextFile) {
      return;
    }
    if (nextFile.size > 10 * 1024 * 1024) {
      setError("File is too large. Please select an image under 10MB.");
      return;
    }
    setError(null);
    setFile(nextFile);
  }

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-2 py-6 sm:px-4">
      <section className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="pt-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 shadow-sm">
            <ShieldCheck size={18} />
            For Parents & Guardians
          </div>
          <h1 className="mt-6 text-5xl font-extrabold leading-[1.05] tracking-tight text-gray-900 md:text-7xl">
            Create <span className="hero-gradient-text">magical memories</span> from one photo and a safe preset.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-600 md:text-xl">
            Upload one child photo, choose from five curated makeover styles, and track the cloud job from upload to final reveal.
            No free-text prompts. No child accounts. Just a guided guardian-operated flow.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 text-sm font-bold text-gray-600">
            <span className="rounded-full border border-white bg-white px-4 py-2 shadow-sm">Delete anytime</span>
            <span className="rounded-full border border-white bg-white px-4 py-2 shadow-sm">No free-text prompts</span>
            <span className="rounded-full border border-white bg-white px-4 py-2 shadow-sm">Child-safe preset styles</span>
          </div>
        </div>

        <div className="glass-panel p-6">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-gray-400">Live job state</p>
          <div className="mt-6 grid gap-4">
            {[
              { label: "Signed upload", done: uploadState !== "idle" },
              { label: "Image stored", done: uploadState === "uploaded" || uploadState === "submitting" || !!job },
              { label: "Worker running", done: job?.status === "processing" || job?.status === "completed" },
              { label: "Result ready", done: job?.status === "completed" }
            ].map((stage) => (
              <div
                key={stage.label}
                className={`flex items-center justify-between rounded-2xl border px-4 py-4 transition-all ${
                  stage.done ? "border-indigo-200 bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "border-gray-100 bg-white text-gray-500"
                }`}
              >
                <span className="font-bold">{stage.label}</span>
                <span className="text-sm font-semibold">{stage.done ? "Done" : "Waiting"}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-[28px] border border-gray-100 bg-white p-5">
            <div className="flex items-center gap-3">
              <div className={`rounded-2xl border p-3 ${activePreset.borderClassName} ${activePreset.chipClassName}`}>
                {(() => {
                  const Icon = ICONS[activePreset.iconKey];
                  return <Icon size={22} />;
                })()}
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-gray-400">Current style</p>
                <p className="text-lg font-extrabold text-gray-900">{activePreset.label}</p>
              </div>
            </div>
            <p className="mt-4 text-sm font-medium leading-7 text-gray-600">
              {job?.status === "processing"
                ? "Our worker is preparing and editing the image now."
                : job?.status === "completed"
                  ? "Your makeover is ready to preview."
                  : job?.status === "failed"
                    ? `This image could not be processed${job.errorCode ? `: ${job.errorCode}` : "."}`
                    : "Upload a photo, choose a style, and start the makeover flow."}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[1fr_1fr]">
        <div className="space-y-8">
          <div className="glass-panel p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white shadow-md">1</div>
              <h2 className="text-2xl font-extrabold text-gray-900">Upload Photo</h2>
            </div>

            <input
              ref={fileInputRef}
              className="hidden"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)}
            />

            {!previewUrl ? (
              <button
                type="button"
                onClick={openFilePicker}
                className="group flex min-h-[22rem] w-full cursor-pointer flex-col items-center justify-center rounded-[28px] border-2 border-dashed border-gray-300 bg-gray-50 px-6 text-center transition-all hover:border-indigo-400 hover:bg-indigo-50"
              >
                <div className="mb-5 rounded-full bg-white p-4 shadow-sm transition-transform group-hover:scale-110">
                  <Upload size={40} className="text-indigo-500" />
                </div>
                <p className="text-xl font-extrabold text-gray-800">Click to upload or drag and drop</p>
                <p className="mt-3 max-w-md text-sm font-medium leading-7 text-gray-500">
                  Clear photo of one child only. JPG, PNG, or WEBP. The backend validates image type and size before processing.
                </p>
              </button>
            ) : (
              <div className="group relative overflow-hidden rounded-[28px] border-2 border-indigo-100 bg-gray-900">
                <img src={previewUrl} alt="Uploaded child preview" className="h-72 w-full object-contain md:h-[28rem]" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/55 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={openFilePicker}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-gray-900 shadow-lg transition-colors hover:bg-gray-100"
                  >
                    <ImageIcon size={18} />
                    Change Photo
                  </button>
                </div>
              </div>
            )}

            <div className="mt-4 flex items-center justify-between gap-3 text-sm font-semibold text-gray-500">
              <span>{file?.name ?? "One photo, one child, parent-guided flow"}</span>
              <span>Delete anytime</span>
            </div>
          </div>

          <div className="glass-panel p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white shadow-md">2</div>
              <h2 className="text-2xl font-extrabold text-gray-900">Choose Magic Style</h2>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
              {PRESETS.map((preset) => {
                const isSelected = preset.id === presetId;
                const Icon = ICONS[preset.iconKey];
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setPresetId(preset.id)}
                    className={`rounded-[24px] border-2 p-4 text-left transition-all duration-300 ${
                      isSelected
                        ? `${preset.activeClassName} scale-[1.03] shadow-md`
                        : "border-gray-100 bg-white hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className={`mb-4 inline-flex rounded-full border p-4 ${preset.chipClassName} ${preset.borderClassName}`}>
                      <Icon size={26} />
                    </div>
                    <p className={`text-sm font-extrabold ${isSelected ? "text-gray-900" : "text-gray-700"}`}>{preset.label}</p>
                    <p className="mt-2 text-xs font-medium leading-6 text-gray-500">{preset.blurb}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="glass-panel p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white shadow-md">3</div>
              <h2 className="text-2xl font-extrabold text-gray-900">
                {job?.status === "processing" ? "Applying Magic..." : "Generate Magic"}
              </h2>
            </div>

            {job?.status === "processing" ? (
              <div className="mb-6 flex flex-col items-center rounded-[28px] border border-gray-100 bg-white px-6 py-10 text-center">
                <div className="relative mb-8 h-28 w-28">
                  <div className="absolute inset-0 rounded-full border-8 border-indigo-50" />
                  <div className="absolute inset-0 animate-spin rounded-full border-8 border-indigo-600 border-t-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center text-indigo-600">
                    {(() => {
                      const Icon = ICONS[activePreset.iconKey];
                      return <Icon size={34} className="animate-pulse" />;
                    })()}
                  </div>
                </div>
                <p className="text-xl font-extrabold text-gray-900">Crafting your child-safe makeover</p>
                <p className="mt-3 max-w-md text-sm font-medium leading-7 text-gray-500">
                  The upload is complete and the worker is processing this preset with identity-preserving guidance.
                </p>
                <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-yellow-200 bg-yellow-50 px-4 py-2 text-sm font-bold text-yellow-800">
                  <Loader2 size={16} className="animate-spin" />
                  Do not close this page
                </div>
              </div>
            ) : null}

            <p className="text-sm font-medium leading-7 text-gray-600">
              We preserve child identity and skin tone, avoid adultification, and keep the experience firmly preset-driven.
            </p>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!canGenerate || uploadState === "uploading" || uploadState === "submitting"}
              className="group mt-6 flex w-full items-center justify-center gap-3 rounded-2xl bg-indigo-600 px-6 py-5 text-lg font-extrabold text-white shadow-xl shadow-indigo-500/25 transition-all hover:bg-indigo-700 hover:shadow-indigo-500/35 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none"
            >
              {uploadState === "uploading" || uploadState === "submitting" ? (
                <>
                  <Loader2 size={22} className="animate-spin" />
                  Working...
                </>
              ) : (
                <>
                  Generate Magic
                  <ChevronRight size={22} className="transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm font-semibold text-gray-500">
              <Link href="/privacy" className="transition-colors hover:text-gray-900">
                Privacy
              </Link>
              <Link href="/terms" className="transition-colors hover:text-gray-900">
                Terms
              </Link>
            </div>
          </div>

          {error ? <ErrorStateCard message={error} /> : null}

          {job?.sourceDownloadUrl && job?.resultDownloadUrl ? (
            <BeforeAfterSlider beforeUrl={job.sourceDownloadUrl} afterUrl={job.resultDownloadUrl} presetLabel={activePreset.label} />
          ) : previewUrl ? (
            <div className="glass-panel p-4">
              <div className="relative overflow-hidden rounded-[32px] bg-white p-4 shadow-inner">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="relative overflow-hidden rounded-[24px] bg-gray-900">
                    <img src={previewUrl} alt="Original preview" className="h-72 w-full object-contain" />
                    <div className="absolute left-4 top-4 rounded-lg bg-black/70 px-3 py-2 text-xs font-bold text-white backdrop-blur">Original</div>
                  </div>
                  <div className="relative flex h-72 items-center justify-center overflow-hidden rounded-[24px] border-4 border-indigo-100 bg-gradient-to-br from-indigo-50 to-purple-50">
                    <div className="text-center">
                      <div className={`mx-auto mb-4 inline-flex rounded-full border p-4 ${activePreset.chipClassName} ${activePreset.borderClassName}`}>
                        {(() => {
                          const Icon = ICONS[activePreset.iconKey];
                          return <Icon size={28} />;
                        })()}
                      </div>
                      <p className="text-xl font-extrabold text-gray-900">AI Magic Preview</p>
                      <p className="mt-2 text-sm font-medium text-gray-500">{activePreset.label} preset selected</p>
                    </div>
                    <div className="absolute left-4 top-4 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-3 py-2 text-xs font-bold text-white">
                      Coming after processing
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel flex min-h-72 items-center justify-center p-8 text-center">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.24em] text-gray-400">Result preview</p>
                <p className="mt-3 max-w-md text-base font-medium leading-8 text-gray-500">
                  Your before-and-after comparison will appear here as soon as the job completes.
                </p>
              </div>
            </div>
          )}

          {job?.jobId ? (
            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex items-center gap-2 rounded-2xl border-2 border-red-100 bg-white px-6 py-4 text-sm font-extrabold text-red-600 transition-all hover:bg-red-50"
            >
              <Trash2 size={18} />
              Delete uploaded and generated images
            </button>
          ) : null}
        </div>
      </section>
    </div>
  );
}
