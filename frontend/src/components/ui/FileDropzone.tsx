"use client";

import React, { useState, useRef } from "react";

export interface FileDropzoneProps {
  accept?: string;
  maxSizeBytes?: number;
  onFileSelect: (file: File) => void;
  selectedFile?: File | null;
  onClear?: () => void;
  error?: string;
  disabled?: boolean;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  accept = ".pdf",
  maxSizeBytes = 10 * 1024 * 1024, // 10MB
  onFileSelect,
  selectedFile,
  onClear,
  error,
  disabled = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [sizeError, setSizeError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndHandle = (file: File) => {
    setSizeError(null);
    if (file.size > maxSizeBytes) {
      setSizeError(`File exceeds maximum size of ${Math.round(maxSizeBytes / (1024 * 1024))}MB.`);
      return;
    }
    onFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndHandle(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndHandle(e.target.files[0]);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="w-full space-y-2">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && !selectedFile && inputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed transition-all duration-200 ${
          disabled
            ? "border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed"
            : selectedFile
            ? "border-indigo-300 bg-indigo-50/40"
            : isDragOver
            ? "border-indigo-500 bg-indigo-50/60 scale-[1.01]"
            : "border-slate-300/80 bg-white/60 hover:border-indigo-400 hover:bg-slate-50/60 cursor-pointer"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          disabled={disabled}
          onChange={handleChange}
          className="hidden"
        />

        {selectedFile ? (
          <div className="flex items-center justify-between w-full max-w-sm p-3 rounded-xl bg-white border border-indigo-200/80 shadow-xs">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 font-bold text-xs uppercase">
                PDF
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-800 truncate">
                  {selectedFile.name}
                </p>
                <p className="text-[11px] text-slate-400">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>

            {onClear && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClear();
                }}
                className="rounded-lg p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}
          </div>
        ) : (
          <div className="text-center space-y-2">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-xs">
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.75"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                PDF documents up to {Math.round(maxSizeBytes / (1024 * 1024))}MB
              </p>
            </div>
          </div>
        )}
      </div>

      {(error || sizeError) && (
        <p className="text-xs font-medium text-rose-600 animate-fade-in flex items-center gap-1">
          <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span>{error || sizeError}</span>
        </p>
      )}
    </div>
  );
};
