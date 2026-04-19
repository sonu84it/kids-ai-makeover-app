import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl px-2 py-8 sm:px-4">
      <div className="glass-panel p-8">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-extrabold text-gray-500 transition-colors hover:text-gray-900">
          <ArrowLeft size={18} />
          Back to home
        </Link>
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-gray-400">Terms</p>
        <h1 className="mt-2 text-4xl font-extrabold text-gray-900">Simple MVP usage terms</h1>
        <div className="mt-8 space-y-6 text-base leading-8 text-gray-600">
          <p>MagicTap Kids is a guardian-operated prototype for preset-based child photo makeovers.</p>
          <p>Use only images you are authorized to upload and process.</p>
          <p>The service may refuse or fail to process images that are unclear, too small, or otherwise unsuitable for safe editing.</p>
          <p>The product is provided as an MVP and may change as safety, quality, and cloud configuration evolve.</p>
        </div>
      </div>
    </div>
  );
}
