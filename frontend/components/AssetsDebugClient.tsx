"use client";

import { useEffect, useState } from "react";
import { Database, ImageIcon, Loader2, RefreshCcw } from "lucide-react";

import { queryAssets } from "@/lib/api";
import { AssetQueryResponse } from "@/lib/types";

const PREFIX_OPTIONS = [
  {
    id: "results",
    label: "Generated results",
    prefix: "gs://magictap-kids-prod-assets/results/"
  },
  {
    id: "uploads",
    label: "Original uploads",
    prefix: "gs://magictap-kids-prod-assets/uploads/"
  }
] as const;

function formatBytes(value: number | null): string {
  if (!value || value <= 0) {
    return "Unknown size";
  }
  const units = ["B", "KB", "MB", "GB"];
  let size = value;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export function AssetsDebugClient() {
  const [selectedPrefix, setSelectedPrefix] = useState<(typeof PREFIX_OPTIONS)[number]["id"]>("results");
  const [response, setResponse] = useState<AssetQueryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadAssets(prefixId: (typeof PREFIX_OPTIONS)[number]["id"]) {
    const active = PREFIX_OPTIONS.find((option) => option.id === prefixId) ?? PREFIX_OPTIONS[0];
    setLoading(true);
    setError(null);
    try {
      const next = await queryAssets({
        prefix: active.prefix,
        limit: 18,
        includeSignedUrls: true
      });
      setResponse(next);
    } catch (nextError) {
      setResponse(null);
      setError(nextError instanceof Error ? nextError.message : "Unable to query stored images.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAssets(selectedPrefix);
  }, [selectedPrefix]);

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-2 py-8 sm:px-4">
      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-gray-400">Debug tooling</p>
          <h1 className="mt-3 text-5xl font-extrabold tracking-tight text-gray-900 md:text-6xl">
            Browse Cloud Storage images with <span className="hero-gradient-text">BigQuery-backed lookup</span>
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-gray-600">
            This page uses the new backend asset query endpoint to list stored upload and result images, return signed preview URLs,
            and expose the exact SQL used against the BigQuery object table.
          </p>
        </div>

        <div className="glass-panel p-6">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-gray-400">Quick scope</p>
          <div className="mt-5 flex flex-wrap gap-3">
            {PREFIX_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setSelectedPrefix(option.id)}
                className={`rounded-full px-5 py-3 text-sm font-extrabold transition-all ${
                  selectedPrefix === option.id
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                    : "border border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => void loadAssets(selectedPrefix)}
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-3 text-sm font-extrabold text-gray-800 transition-all hover:-translate-y-0.5 hover:border-gray-300"
          >
            <RefreshCcw size={16} />
            Refresh query
          </button>
        </div>
      </section>

      <section className="glass-panel p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-600">
            <Database size={22} />
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-gray-400">SQL</p>
            <p className="text-lg font-extrabold text-gray-900">Active BigQuery query</p>
          </div>
        </div>
        <pre className="mt-5 overflow-x-auto rounded-[24px] bg-slate-950 p-5 text-sm leading-7 text-slate-100">
          {response?.sql ?? "Waiting for query results..."}
        </pre>
      </section>

      {loading ? (
        <section className="glass-panel flex min-h-[24rem] flex-col items-center justify-center p-8 text-center">
          <Loader2 size={32} className="animate-spin text-indigo-600" />
          <p className="mt-4 text-xl font-extrabold text-gray-900">Querying image metadata</p>
          <p className="mt-2 text-sm font-medium text-gray-500">Pulling image rows and signed preview links from the live API.</p>
        </section>
      ) : error ? (
        <section className="glass-panel rounded-[32px] border border-red-100 bg-red-50/80 p-6">
          <p className="text-lg font-extrabold text-red-700">Asset query failed</p>
          <p className="mt-3 text-sm font-medium leading-7 text-red-600">{error}</p>
        </section>
      ) : (
        <section className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-gray-400">Results</p>
              <h2 className="mt-1 text-3xl font-extrabold text-gray-900">{response?.rows.length ?? 0} images returned</h2>
            </div>
            <div className="rounded-full border border-white bg-white px-4 py-2 text-sm font-bold text-gray-600 shadow-sm">
              Prefix: {PREFIX_OPTIONS.find((option) => option.id === selectedPrefix)?.label}
            </div>
          </div>

          {response?.rows.length ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {response.rows.map((asset) => (
                <article key={asset.uri} className="glass-panel overflow-hidden p-4">
                  <div className="relative overflow-hidden rounded-[24px] bg-slate-100">
                    {asset.signedUrl ? (
                      <img src={asset.signedUrl} alt={asset.objectPath} className="h-72 w-full object-cover" />
                    ) : (
                      <div className="flex h-72 items-center justify-center text-gray-400">
                        <ImageIcon size={32} />
                      </div>
                    )}
                  </div>
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-bold uppercase tracking-[0.22em] text-gray-400">{asset.contentType ?? "Unknown type"}</p>
                    <p className="break-all text-base font-extrabold text-gray-900">{asset.objectPath}</p>
                    <p className="text-sm font-medium text-gray-500">{formatBytes(asset.size)}</p>
                    <p className="break-all text-xs font-medium leading-6 text-gray-400">{asset.uri}</p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="glass-panel flex min-h-[18rem] items-center justify-center p-8 text-center">
              <div>
                <p className="text-xl font-extrabold text-gray-900">No images matched this prefix</p>
                <p className="mt-3 text-sm font-medium leading-7 text-gray-500">
                  Try switching between generated results and original uploads, or create a fresh makeover first.
                </p>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
