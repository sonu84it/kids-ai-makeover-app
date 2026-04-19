"use client";

interface UploadCardProps {
  fileName: string | null;
  previewUrl: string | null;
  onFileChange: (file: File | null) => void;
}

export function UploadCard({ fileName, previewUrl, onFileChange }: UploadCardProps) {
  return (
    <div className="panel p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ink/55">1. Upload one photo</p>
          <h3 className="mt-1 text-xl font-semibold">Choose a child portrait or half-body image</h3>
        </div>
        <span className="rounded-full bg-mint px-3 py-1 text-sm font-semibold text-ink">For parents/guardians</span>
      </div>

      <label className="flex min-h-72 cursor-pointer flex-col items-center justify-center rounded-[24px] border border-dashed border-ink/20 bg-mist px-6 text-center transition hover:border-ink/40">
        <input
          className="hidden"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
        />
        {previewUrl ? (
          <img src={previewUrl} alt="Uploaded child preview" className="h-56 w-auto rounded-[20px] object-cover shadow-soft" />
        ) : (
          <>
            <div className="mb-3 rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink shadow-soft">Tap to upload</div>
            <p className="max-w-sm text-sm leading-6 text-ink/70">
              We keep the interface preset-driven and child-safe. No free-text prompts, no character chat, just a guided makeover flow.
            </p>
          </>
        )}
      </label>

      <div className="mt-4 flex items-center justify-between text-sm text-ink/65">
        <span>{fileName ?? "PNG, JPG, or WEBP up to the configured size limit"}</span>
        <span>Delete anytime</span>
      </div>
    </div>
  );
}
