"use client";

interface ErrorStateCardProps {
  message: string;
}

export function ErrorStateCard({ message }: ErrorStateCardProps) {
  return (
    <div className="rounded-[28px] border border-red-200 bg-red-50 p-5 text-red-700 shadow-sm">
      <p className="text-sm font-bold uppercase tracking-[0.18em]">Something needs attention</p>
      <p className="mt-2 text-base font-medium leading-7">{message}</p>
    </div>
  );
}
