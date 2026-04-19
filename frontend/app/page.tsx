import Link from "next/link";
import { Camera, ChevronRight, Crown, Gift, Rocket, ShieldCheck, TreePine } from "lucide-react";

import { PRESETS } from "@/lib/presets";

const ICONS = {
  camera: Camera,
  rocket: Rocket,
  crown: Crown,
  tree: TreePine,
  gift: Gift
} as const;

export default function LandingPage() {
  return (
    <div className="mx-auto max-w-7xl px-2 py-8 sm:px-4">
      <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 shadow-sm">
            <ShieldCheck size={18} />
            For Parents & Guardians
          </div>
          <h1 className="mt-6 max-w-4xl text-5xl font-extrabold leading-[1.05] tracking-tight text-gray-900 md:text-7xl">
            Turn photos into <span className="hero-gradient-text">magical memories</span> with guided, child-safe presets.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-600 md:text-xl">
            Upload one child photo, choose a preset, and let MagicTap Kids handle the signed upload, cloud processing,
            and final side-by-side preview. No prompt box, no character chat, and no surprises for families.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/app"
              className="group inline-flex items-center gap-2 rounded-full bg-gray-900 px-8 py-4 text-base font-extrabold text-white shadow-xl transition-all hover:-translate-y-1 hover:bg-gray-800"
            >
              Start Makeover
              <ChevronRight size={20} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/privacy"
              className="rounded-full border border-white bg-white px-8 py-4 text-base font-extrabold text-gray-800 shadow-sm transition-all hover:-translate-y-1"
            >
              Privacy & Safety
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-3 text-sm font-bold text-gray-600">
            <span className="rounded-full border border-white bg-white px-4 py-2 shadow-sm">No free-text prompts</span>
            <span className="rounded-full border border-white bg-white px-4 py-2 shadow-sm">Delete anytime</span>
            <span className="rounded-full border border-white bg-white px-4 py-2 shadow-sm">Guardian-operated only</span>
          </div>
        </div>

        <div className="glass-panel p-6">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-gray-400">What parents see</p>
          <div className="mt-5 space-y-4">
            <div className="rounded-[24px] border border-gray-100 bg-white p-5">
              <p className="font-extrabold text-gray-900">1. Upload</p>
              <p className="mt-2 text-sm font-medium leading-7 text-gray-500">One photo, direct-to-storage upload, no account required.</p>
            </div>
            <div className="rounded-[24px] border border-gray-100 bg-white p-5">
              <p className="font-extrabold text-gray-900">2. Pick one preset</p>
              <p className="mt-2 text-sm font-medium leading-7 text-gray-500">No free-text prompts. Only five child-safe makeover styles.</p>
            </div>
            <div className="rounded-[24px] border border-gray-100 bg-white p-5">
              <p className="font-extrabold text-gray-900">3. Track and compare</p>
              <p className="mt-2 text-sm font-medium leading-7 text-gray-500">Live job status, before/after preview, and delete support.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-14">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-gray-400">Preset lineup</p>
            <h2 className="mt-1 text-3xl font-extrabold text-gray-900">Five guided styles</h2>
          </div>
          <span className="rounded-full border border-white bg-white px-4 py-2 text-sm font-bold text-gray-700 shadow-sm">No prompt textbox</span>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          {PRESETS.map((preset) => {
            const Icon = ICONS[preset.iconKey];
            return (
              <div key={preset.id} className="glass-panel p-5 transition-transform hover:scale-[1.02]">
                <div className={`mb-4 inline-flex rounded-full border p-4 ${preset.chipClassName} ${preset.borderClassName}`}>
                  <Icon size={28} />
                </div>
                <h3 className="text-xl font-extrabold text-gray-900">{preset.label}</h3>
                <p className="mt-3 text-sm font-medium leading-7 text-gray-500">{preset.blurb}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
