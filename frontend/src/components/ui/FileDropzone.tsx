"use client";

import React, { useState, useRef } from "react";
import {
  PiUploadSimpleLight,
  PiFilePdfLight,
  PiXLight,
  PiWarningCircleLight,
} from "react-icons/pi";

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
            ? "border-[#d8e2dc] bg-[#f1faee]/50 opacity-60 cursor-not-allowed"
            : selectedFile
            ? "border-[#40916c] bg-[#ffffff] shadow-sm"
            : isDragOver
            ? "border-[#40916c] bg-[#d8f3dc]/30 scale-[1.01]"
            : "border-[#d8f3dc] bg-[#ffffff] hover:border-[#40916c] hover:bg-[#f1faee]/40 cursor-pointer shadow-sm"
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
          <div className="flex items-center justify-between w-full max-w-sm p-3.5 rounded-xl bg-[#f8fbf9] border border-[#d8f3dc] shadow-xs">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#d8f3dc] text-[#2d6a4f] border border-[#b7e4c7]">
                <PiFilePdfLight size={22} />
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-[#1b4332] truncate">
                  {selectedFile.name}
                </p>
                <p className="text-[11px] text-[#6b8f7e]">
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
                className="rounded-lg p-1.5 text-[#52796f] hover:text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <PiXLight size={16} />
              </button>
            )}
          </div>
        ) : (
          <div className="text-center space-y-2">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#f1faee] text-[#40916c] shadow-inner">
              <PiUploadSimpleLight size={24} />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#1b4332]">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-[#6b8f7e] mt-0.5">
                PDF documents up to {Math.round(maxSizeBytes / (1024 * 1024))}MB
              </p>
            </div>
          </div>
        )}
      </div>

      {(error || sizeError) && (
        <p className="text-xs font-medium text-rose-500 animate-fade-in flex items-center gap-1">
          <PiWarningCircleLight size={14} className="shrink-0" />
          <span>{error || sizeError}</span>
        </p>
      )}
    </div>
  );
};
