"use client";

import { useState } from "react";
import { buttonClass } from "@/lib/buttonStyles";

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
    <div className="flex items-center gap-2 rounded-2xl border-[3px] border-ink bg-[#fffaf0] px-4 py-3 shadow-[0_4px_0_rgba(43,24,16,0.35)]">
      <span className="flex-1 truncate text-sm text-stone-600">{link}</span>
      <button type="button" onClick={handleCopy} className={buttonClass("secondary", "sm")}>
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
