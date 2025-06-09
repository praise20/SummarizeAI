import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { CloudUpload, FileAudio, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  file: File | null;
  onFileSelect: (file: File | null) => void;
  accept?: string;
  maxSize?: number;
  className?: string;
}

export function FileUpload({ 
  file, 
  onFileSelect, 
  accept = ".mp3,.mp4,.m4a,.wav",
  maxSize = 100 * 1024 * 1024, // 100MB
  className 
}: FileUploadProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'audio/*': accept.split(','),
      'video/*': ['.mp4'],
    },
    maxSize,
    multiple: false,
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const removeFile = () => {
    onFileSelect(null);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {!file ? (
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors",
            isDragActive 
              ? "border-primary bg-primary/5" 
              : "border-gray-300 dark:border-gray-600 hover:border-primary hover:bg-primary/5"
          )}
        >
          <input {...getInputProps()} />
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CloudUpload className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {isDragActive ? "Drop your file here" : "Drop your file here"}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Or click to browse and select a file from your computer
          </p>
          <Button type="button" variant="outline">
            Choose File
          </Button>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
            Supports {accept} files up to {formatFileSize(maxSize)}
          </p>
        </div>
      ) : (
        <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <FileAudio className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">{file.name}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">{formatFileSize(file.size)}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={removeFile}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {fileRejections.length > 0 && (
        <div className="text-sm text-red-600 dark:text-red-400">
          {fileRejections[0].errors[0].message}
        </div>
      )}
    </div>
  );
}
