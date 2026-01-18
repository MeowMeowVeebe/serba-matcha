"use client";

import { useState, useRef, type ChangeEvent } from "react";
import { Button } from "./Button";

export type FileUploadProps = {
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in bytes
  maxFiles?: number;
  onFilesSelected?: (files: File[]) => void;
  onError?: (error: string) => void;
  label?: string;
  helperText?: string;
  showPreview?: boolean;
  disabled?: boolean;
};

export function FileUpload({
  accept,
  multiple = false,
  maxSize = 5 * 1024 * 1024, // 5MB default
  maxFiles = 5,
  onFilesSelected,
  onError,
  label = "Upload Files",
  helperText,
  showPreview = true,
  disabled = false,
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (maxSize && file.size > maxSize) {
      return `File ${file.name} is too large. Max size: ${(maxSize / 1024 / 1024).toFixed(2)}MB`;
    }
    return null;
  };

  const handleFiles = (newFiles: File[]) => {
    const validFiles: File[] = [];
    const errors: string[] = [];

    for (const file of newFiles) {
      const error = validateFile(file);
      if (error) {
        errors.push(error);
      } else {
        validFiles.push(file);
      }
    }

    if (errors.length > 0) {
      onError?.(errors.join(", "));
    }

    const totalFiles = [...files, ...validFiles];
    if (totalFiles.length > maxFiles) {
      onError?.(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setFiles(totalFiles);
    onFilesSelected?.(totalFiles);

    // Generate previews for images
    if (showPreview) {
      validFiles.forEach((file) => {
        if (file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onload = (e) => {
            setPreviews((prev) => [...prev, e.target?.result as string]);
          };
          reader.readAsDataURL(file);
        }
      });
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    handleFiles(selectedFiles);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setFiles(newFiles);
    setPreviews(newPreviews);
    onFilesSelected?.(newFiles);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="file-upload">
      {label && <label className="file-upload__label">{label}</label>}

      <div
        className={`file-upload__dropzone ${isDragging ? "file-upload__dropzone--dragging" : ""} ${
          disabled ? "file-upload__dropzone--disabled" : ""
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          disabled={disabled}
          style={{ display: "none" }}
        />

        <div className="file-upload__content">
          <span className="file-upload__icon">📁</span>
          <p className="file-upload__text">
            {isDragging ? "Drop files here" : "Drag & drop files here or"}
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
          >
            Browse Files
          </Button>
        </div>
      </div>

      {helperText && <p className="file-upload__helper">{helperText}</p>}

      {/* File List */}
      {files.length > 0 && (
        <div className="file-upload__list">
          {files.map((file, index) => (
            <div key={index} className="file-upload__item">
              {previews[index] && (
                <img src={previews[index]} alt={file.name} className="file-upload__preview" />
              )}
              <div className="file-upload__info">
                <span className="file-upload__filename">{file.name}</span>
                <span className="file-upload__filesize">{formatFileSize(file.size)}</span>
              </div>
              <button
                className="file-upload__remove"
                onClick={() => removeFile(index)}
                aria-label="Remove file"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
