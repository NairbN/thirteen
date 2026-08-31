"use client";

import { useEffect } from "react";
import { useGameStore, type ToastItem } from "@/store/gameStore";

const AUTO_DISMISS_MS = 4000;

function ToastRow({ toast }: { toast: ToastItem }) {
  const dismissToast = useGameStore((s) => s.dismissToast);

  useEffect(() => {
    const timer = setTimeout(() => dismissToast(toast.id), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [toast.id, dismissToast]);

  return (
    <div
      role="status"
      className={`rounded-md px-4 py-2 text-sm shadow-md ${
        toast.variant === "error" ? "bg-rose-600 text-white" : "bg-zinc-800 text-white"
      }`}
    >
      {toast.message}
    </div>
  );
}

export default function Toast() {
  const toasts = useGameStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastRow toast={toast} />
        </div>
      ))}
    </div>
  );
}
