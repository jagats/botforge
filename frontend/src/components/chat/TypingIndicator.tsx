"use client";

import React from "react";

export const TypingIndicator: React.FC = () => {
  return (
    <div className="inline-flex items-center gap-1.5 px-4 py-3 rounded-md bg-[rgba(221,208,200,0.12)] border border-[rgba(221,208,200,0.22)] shadow-xs backdrop-blur-xs">
      <span className="h-2 w-2 rounded-full bg-[#DDD0C8] animate-bounce [animation-delay:-0.3s]" />
      <span className="h-2 w-2 rounded-full bg-[#DDD0C8] animate-bounce [animation-delay:-0.15s]" />
      <span className="h-2 w-2 rounded-full bg-[#DDD0C8] animate-bounce" />
    </div>
  );
};
