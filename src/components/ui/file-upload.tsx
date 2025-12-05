"use client";

import { useState, useCallback } from "react";
import { Upload, X, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface FileUploadProps {
  onUpload: (file: File) => Promise<void>;
  accept?: string;
  maxSize?: number; // in MB
  disabled?: boolean;
  className?: string;
}

export function FileUpload({
  onUpload,
  accept = ".csv,.xlsx,.xls",
  maxSize = 10,
  disabled = false,
  className,
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (disabled) return;

      const files = e.dataTransfer.files;
      if (files && files[0]) {
        handleFile(files[0]);
      }
    },
    [disabled]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const files = e.target.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFile = async (file: File) => {
    setError(null);

    // Validate file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const validExtensions = ['csv', 'xlsx', 'xls'];
    
    if (!fileExtension || !validExtensions.includes(fileExtension)) {
      setError("Please upload a CSV or Excel file");
      toast.error("Invalid file type. Please upload CSV or Excel file.");
      return;
    }

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size must be less than ${maxSize}MB`);
      toast.error(`File too large. Maximum size is ${maxSize}MB.`);
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      await onUpload(file);

      clearInterval(progressInterval);
      setProgress(100);
      toast.success("File uploaded successfully!");

      // Reset after success
      setTimeout(() => {
        setUploading(false);
        setProgress(0);
      }, 1000);
    } catch (error) {
      console.error("Upload error:", error);
      setError(error instanceof Error ? error.message : "Upload failed");
      toast.error(error instanceof Error ? error.message : "Failed to upload file");
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept={accept}
            onChange={handleFileInput}
            disabled={disabled || uploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />

          {uploading ? (
            <div className="space-y-4">
              <div className="w-12 h-12 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary animate-pulse" />
              </div>
              <div>
                <p className="font-medium">Uploading file...</p>
                <Progress value={progress} className="mt-2" />
                <p className="text-sm text-muted-foreground mt-1">{progress}%</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-12 h-12 mx-auto bg-muted rounded-full flex items-center justify-center">
                <Upload className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">
                  Drop your file here, or click to browse
                </p>
                <p className="text-sm text-muted-foreground">
                  Supports CSV, Excel files up to {maxSize}MB
                </p>
              </div>
              <Button variant="outline" disabled={disabled}>
                Choose File
              </Button>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 text-destructive">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Validation results display
interface ValidationResultsProps {
  results: {
    valid: number;
    invalid: number;
    errors: string[];
  };
  onConfirm?: () => void;
  onCancel?: () => void;
  loading?: boolean;
}

export function ValidationResults({
  results,
  onConfirm,
  onCancel,
  loading = false,
}: ValidationResultsProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="font-medium">{results.valid} valid records</span>
            </div>
            {results.invalid > 0 && (
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-destructive" />
                <span className="font-medium">{results.invalid} invalid records</span>
              </div>
            )}
          </div>

          {results.errors.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-destructive">Errors found:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                {results.errors.slice(0, 5).map((error, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-destructive">•</span>
                    <span>{error}</span>
                  </li>
                ))}
                {results.errors.length > 5 && (
                  <li className="text-muted-foreground">
                    ... and {results.errors.length - 5} more errors
                  </li>
                )}
              </ul>
            </div>
          )}

          <div className="flex gap-2 pt-4 border-t">
            {onCancel && (
              <Button variant="outline" onClick={onCancel} disabled={loading}>
                Cancel
              </Button>
            )}
            {onConfirm && (
              <Button 
                onClick={onConfirm} 
                disabled={results.valid === 0 || loading}
                loading={loading}
              >
                Import {results.valid} Records
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
