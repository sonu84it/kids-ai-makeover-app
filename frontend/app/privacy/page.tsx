import { ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl px-2 py-8 sm:px-4">
      <div className="glass-panel p-8">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-extrabold text-gray-500 transition-colors hover:text-gray-900">
          <ArrowLeft size={18} />
          Back to home
        </Link>
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 shadow-sm">
          <ShieldCheck size={18} />
          Privacy & Safety
        </div>
        <h1 className="mt-4 text-4xl font-extrabold text-gray-900">Parent-facing privacy notes</h1>
        <div className="mt-8 space-y-6 text-base leading-8 text-gray-600">
          <div className="rounded-[24px] border border-indigo-100 bg-indigo-50 p-6 text-indigo-900">
            <h2 className="flex items-center gap-2 text-xl font-extrabold">
              <ShieldCheck size={20} className="text-indigo-600" />
              For parents & guardians
            </h2>
            <p className="mt-3">MagicTap Kids is intended for parents and guardians uploading a child image for a preset makeover workflow.</p>
          </div>
          <p>
            We process the uploaded source image to generate a transformed output image. Files may be stored for a limited period
            needed to complete the job, review the result, and support deletion requests.
          </p>
          <p>
            The interface does not expose a free-text prompt box for end users. Preset styles are fixed to reduce risky or
            off-policy transformations.
          </p>
          <p>
            Uploaded and generated images can be deleted through the product flow. Avoid uploading images you do not want
            processed through cloud services.
          </p>
        </div>
      </div>
    </div>
  );
}
