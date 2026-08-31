"use client";

import { useState } from "react";

interface ShareLinkBoxProps {
  code: string;
}

export default function ShareLinkBox({ code }: ShareLinkBoxProps) {
  const [copied, setCopied] = useState(false);
  const link = typeof window !== "undefined" ? `${window.location.origin}/room/${code}` : `/room/${code}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable; the link text is still selectable.
    }
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
      <span className="flex-1 truncate text-sm text-zinc-600 dark:text-zinc-400">{link}</span>
      <button
        type="button"
        onClick={handleCopy}
        className="rounded bg-sky-600 px-3 py-1.5 text-sm font-semibold text-white"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
