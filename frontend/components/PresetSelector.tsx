"use client";

import { PRESETS } from "@/lib/presets";
import { PresetId } from "@/lib/types";

interface PresetSelectorProps {
  value: PresetId | null;
  onChange: (presetId: PresetId) => void;
}

export function PresetSelector({ value, onChange }: PresetSelectorProps) {
  return (
    <div className="panel p-6">
      <div className="mb-4">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ink/55">2. Pick one style</p>
        <h3 className="mt-1 text-xl font-semibold">Preset styles only</h3>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {PRESETS.map((preset) => {
          const active = preset.id === value;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onChange(preset.id)}
              className={`rounded-[24px] border p-4 text-left transition ${
                active ? "border-ink bg-ink text-white shadow-soft" : "border-ink/10 bg-white hover:border-ink/35"
              }`}
            >
              <div className={`mb-4 h-20 rounded-[18px] bg-gradient-to-br ${active ? "opacity-80" : ""} ${preset.accent}`} />
              <h4 className="text-lg font-semibold">{preset.label}</h4>
              <p className={`mt-2 text-sm leading-6 ${active ? "text-white/82" : "text-ink/70"}`}>{preset.blurb}</p>
            </button>
          );
        })}
      </div>
      <p className="mt-4 text-sm text-ink/60">Child-safe preset styles. No free-text prompting is exposed to end users.</p>
    </div>
  );
}
