"use client";

import { useState, useCallback } from "react";

export function useCopyToClipboard(resetDelayMs: number = 2000) {
  const [copied, setCopied] = useState<boolean>(false);

  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      if (!navigator?.clipboard) {
        console.warn("Clipboard not supported");
        return false;
      }
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), resetDelayMs);
        return true;
      } catch (error) {
        console.warn("Copy failed", error);
        setCopied(false);
        return false;
      }
    },
    [resetDelayMs]
  );

  return { copied, copy };
}
