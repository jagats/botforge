"use client";

import React from "react";

export const TypingIndicator: React.FC = () => {
  return (
    <div className="inline-flex items-center gap-1.5 px-4 py-3 rounded-2xl rounded-bl-xs bg-white/90 border border-slate-200/80 shadow-xs backdrop-blur-xs">
      <span className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.3s]" />
      <span className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.15s]" />
      <span className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce" />
    </div>
  );
};
