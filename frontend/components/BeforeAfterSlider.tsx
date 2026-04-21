"use client";

import { useState } from "react";

interface BeforeAfterSliderProps {
  beforeUrl: string;
  afterUrl: string;
  presetLabel?: string;
}

export function BeforeAfterSlider({ beforeUrl, afterUrl, presetLabel }: BeforeAfterSliderProps) {
  const [position, setPosition] = useState(52);

  return (
    <div className="glass-panel p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-gray-400">Compare result</p>
          <h3 className="mt-1 text-2xl font-extrabold text-gray-900">Before and after</h3>
        </div>
        <span className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-sm font-bold text-indigo-700">
          {presetLabel ? `AI Magic (${presetLabel})` : "Child-safe preset styles"}
        </span>
      </div>

      <div className="relative aspect-[4/3] overflow-hidden rounded-[30px] border border-gray-100 bg-gray-900">
        <img src={afterUrl} alt="After makeover" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 overflow-hidden" style={{ width: `${position}%` }}>
          <img src={beforeUrl} alt="Before makeover" className="h-full w-full object-contain" />
        </div>
        <div className="absolute inset-y-0" style={{ left: `calc(${position}% - 1px)` }}>
          <div className="relative h-full w-0.5 bg-white shadow-[0_0_0_1px_rgba(18,36,58,0.2)]">
            <div className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white bg-indigo-600 shadow-lg" />
          </div>
        </div>
        <div className="absolute left-4 top-4 rounded-lg bg-black/70 px-3 py-2 text-xs font-bold text-white backdrop-blur">Original</div>
        <div className="absolute right-4 top-4 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-3 py-2 text-xs font-bold text-white">
          AI Magic
        </div>
      </div>

      <input
        aria-label="Compare before and after"
        type="range"
        min={0}
        max={100}
        value={position}
        onChange={(event) => setPosition(Number(event.target.value))}
        className="mt-5 w-full accent-indigo-600"
      />
    </div>
  );
}
