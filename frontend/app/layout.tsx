import "./globals.css";

import Link from "next/link";
import type { Metadata } from "next";
import { ReactNode } from "react";
import { ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "MagicTap Kids",
  description: "Guardian-operated AI makeover app with child-safe preset styles."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="canvas-shell min-h-screen">
          <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 sm:px-6">
            <header className="sticky top-0 z-20 pt-4">
              <nav className="glass-panel flex items-center justify-between px-4 py-4 sm:px-6">
                <Link href="/" className="group flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-xl font-bold text-white shadow-lg shadow-indigo-500/30 transition-transform group-hover:scale-105">
                    M
                  </div>
                  <div>
                    <p className="text-xl font-extrabold tracking-tight text-gray-900">
                      MagicTap <span className="text-indigo-600">Kids</span>
                    </p>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-400">Guardian-operated</p>
                  </div>
                </Link>
                <div className="hidden items-center gap-5 text-sm font-semibold text-gray-500 md:flex">
                  <Link href="/app" className="transition-colors hover:text-gray-900">
                    App
                  </Link>
                  <Link href="/privacy" className="transition-colors hover:text-gray-900">
                    Privacy
                  </Link>
                  <Link href="/terms" className="transition-colors hover:text-gray-900">
                    Terms
                  </Link>
                  <span className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-2 text-indigo-700">
                    <ShieldCheck size={16} />
                    Child-safe presets
                  </span>
                </div>
              </nav>
            </header>
            <main className="flex-1 pb-12 pt-6">{children}</main>
          </div>
          <div className="pointer-events-none absolute left-[-6%] top-[12%] -z-10 h-80 w-80 rounded-full bg-indigo-100/60 blur-3xl" />
          <div className="pointer-events-none absolute right-[-8%] top-[2%] -z-10 h-96 w-96 rounded-full bg-purple-100/60 blur-3xl" />
          <div className="pointer-events-none absolute bottom-[-10%] left-[8%] -z-10 h-96 w-96 rounded-full bg-sky-100/50 blur-3xl" />
          <div className="pointer-events-none absolute bottom-[12%] right-[8%] -z-10 h-72 w-72 rounded-full bg-rose-100/40 blur-3xl" />
        </div>
      </body>
    </html>
  );
}
