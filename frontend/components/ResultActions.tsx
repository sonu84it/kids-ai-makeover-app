"use client";

import { useRouter } from "next/navigation";
import { ChevronRight, Trash2 } from "lucide-react";

import { deleteJob } from "@/lib/api";

interface ResultActionsProps {
  jobId: string;
}

export function ResultActions({ jobId }: ResultActionsProps) {
  const router = useRouter();

  async function handleDelete() {
    await deleteJob(jobId);
    router.push("/app");
    router.refresh();
  }

  return (
    <div className="mt-8 flex flex-wrap items-center gap-4">
      <button
        type="button"
        onClick={() => router.push("/app")}
        className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-5 py-3 text-sm font-extrabold text-white shadow-lg transition-all hover:-translate-y-1"
      >
        Start another
        <ChevronRight size={18} />
      </button>
      <button
        type="button"
        onClick={handleDelete}
        className="inline-flex items-center gap-2 rounded-full border-2 border-red-100 bg-white px-5 py-3 text-sm font-extrabold text-red-600 transition-all hover:bg-red-50"
      >
        <Trash2 size={18} />
        Delete uploaded and generated images
      </button>
    </div>
  );
}
